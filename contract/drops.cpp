#include "drops.hpp"
#include "ram.hpp"
#include <eosio.system/exchange_state.hpp>

constexpr char hexmap[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};

std::string hexStr(unsigned char* data, int len)
{
   std::string s(len * 2, ' ');
   for (int i = 0; i < len; ++i) {
      s[2 * i]     = hexmap[(data[i] & 0xF0) >> 4];
      s[2 * i + 1] = hexmap[data[i] & 0x0F];
   }
   return s;
}

drops::epoch_row drops::advance_epoch()
{
   // Retrieve contract state
   drops::state_table state(_self, _self.value);
   auto               state_itr = state.find(1);
   uint64_t           epoch     = state_itr->epoch;
   check(state_itr->enabled, "Contract is currently disabled.");

   // Retrieve current epoch based on state
   drops::epochs_table epochs(_self, _self.value);
   auto                epoch_itr = epochs.find(epoch);
   check(epoch_itr != epochs.end(), "Epoch from state does not exist.");
   check(current_time_point() >= epoch_itr->end,
         "Current epoch " + std::to_string(epoch) + " has not ended (" + epoch_itr->end.to_string() + ").");

   // Advance epoch number
   uint64_t new_epoch = epoch + 1;

   // Update the epoch in state
   state.modify(state_itr, _self, [&](auto& row) { row.epoch = new_epoch; });

   // Base the next epoch off the current epoch
   time_point new_epoch_start    = epoch_itr->end;
   time_point new_epoch_end      = epoch_itr->end + eosio::seconds(epochphasetimer * 1);
   time_point new_epoch_reveal   = epoch_itr->end + eosio::seconds(epochphasetimer * 2);
   time_point new_epoch_complete = epoch_itr->end + eosio::seconds(epochphasetimer * 3);

   // Save the next epoch
   epochs.emplace(_self, [&](auto& row) {
      row.epoch    = new_epoch;
      row.start    = new_epoch_start;
      row.end      = new_epoch_end;
      row.reveal   = new_epoch_reveal;
      row.complete = new_epoch_complete;
   });

   // Return the next epoch
   return {
      new_epoch, new_epoch_start, new_epoch_end, new_epoch_reveal, new_epoch_complete,
   };
}

[[eosio::on_notify("eosio.token::transfer")]] drops::generate_return_value
drops::generate(name from, name to, asset quantity, std::string memo)
{
   if (from == "eosio.ram"_n || to != _self || from == _self || memo == "bypass") {
      return {(uint32_t)0, (uint64_t)0, asset{0, EOS}, asset{0, EOS}, (uint64_t)0, (uint64_t)0};
   }

   require_auth(from);
   check(quantity.amount > 0, "The transaction amount must be a positive value.");
   check(quantity.symbol == EOS, "Only the system token is accepted for transfers.");
   check(!memo.empty(), "A memo is required to send tokens to this contract");

   // Retrieve contract state
   state_table state(_self, _self.value);
   auto        state_itr = state.find(1);
   uint64_t    epoch     = state_itr->epoch;
   check(state_itr->enabled, "Contract is currently disabled.");

   epochs_table epochs(_self, _self.value);
   auto         epoch_itr = epochs.find(epoch);
   check(epoch_itr != epochs.end(), "Epoch does not exist.");

   time_point epoch_end = epoch_itr->end;

   // If the epoch has ended, advance until we exist in the current epoch
   while (current_time_point() >= epoch_end) {
      auto new_epoch = advance_epoch();
      epoch          = new_epoch.epoch;
      epoch_end      = new_epoch.end;
   }

   // Process the memo field to determine the number of seeds to generate
   std::vector<std::string> parsed = split(memo, ',');
   check(parsed.size() == 2, "Memo data must contain 2 values, seperated by a comma: amount,seed_data.");

   // Ensure amount is a positive value
   int amount = stoi(parsed[0]);
   check(amount > 0, "The amount of seeds to generate must be a positive value.");

   // Ensure string length
   string data = parsed[1];
   check(data.length() > 32, "Seed data must be at least 32 characters in length.");

   // Calculate amount of RAM needing to be purchased
   // TODO: Additional RAM is being purchased to account for the buyrambytes bug
   // https://github.com/EOSIO/eosio.system/issues/30
   uint64_t ram_purchase_amount = amount * (record_size + purchase_buffer);

   // Determine if this account exists in the accounts table
   accounts_table accounts(_self, _self.value);
   auto           account_itr        = accounts.find(from.value);
   bool           account_row_exists = account_itr != accounts.end();

   // First time accounts must purchase the extra ram to persist their stats in memory
   // TODO: Need to decide if we should persist this data or not
   if (!account_row_exists) {
      ram_purchase_amount += accounts_row;
   }

   // Determine if this account exists in the epoch stats table
   stats_table stats(_self, _self.value);
   auto        stat_idx        = stats.get_index<"accountepoch"_n>();
   auto        stat_itr        = stat_idx.find((uint128_t)from.value << 64 | epoch);
   bool        stat_row_exists = stat_itr != stat_idx.end();

   //    drops::commits_table commits(_self, _self.value);
   //    auto                commit_idx = commits.get_index<"oracle"_n>();
   //    auto                commit_itr = commit_idx.find(oracle.value);
   //    check(commit_itr == commit_idx.end(), "Oracle has already committed");

   // First time epoch stats must purchase the extra ram to persist their stats in memory
   // TODO: Need to decide if we should persist this data or not
   if (!stat_row_exists) {
      ram_purchase_amount += stats_row;
   }

   // Purchase the RAM
   action(permission_level{_self, "active"_n}, "eosio"_n, "buyrambytes"_n,
          std::make_tuple(_self, _self, ram_purchase_amount))
      .send();

   // Iterate over all seeds to be created and insert them into the seeds table
   seeds_table seeds(_self, _self.value);
   for (int i = 0; i < amount; i++) {
      string   value      = std::to_string(i) + data;
      auto     hash       = sha256(value.c_str(), value.length());
      auto     byte_array = hash.extract_as_byte_array();
      uint64_t seed;
      memcpy(&seed, &byte_array, sizeof(uint64_t));
      seeds.emplace(_self, [&](auto& row) {
         row.seed  = seed;
         row.owner = from;
         row.epoch = epoch;
      });
   }

   // Either update the account row or insert a new row
   uint64_t new_seeds_total = amount;
   if (account_row_exists) {
      new_seeds_total += account_itr->seeds;
      accounts.modify(account_itr, _self, [&](auto& row) { row.seeds = new_seeds_total; });
   } else {
      accounts.emplace(_self, [&](auto& row) {
         row.account = from;
         row.seeds   = new_seeds_total;
      });
   }

   // Either update the stats row or insert a new row
   uint64_t new_seeds_epoch = amount;
   if (stat_row_exists) {
      new_seeds_epoch += stat_itr->seeds;
      stat_idx.modify(stat_itr, _self, [&](auto& row) { row.seeds = new_seeds_epoch; });
   } else {
      stats.emplace(_self, [&](auto& row) {
         row.id      = stats.available_primary_key();
         row.account = from;
         row.seeds   = new_seeds_epoch;
         row.epoch   = epoch;
      });
   }

   // Calculate the purchase cost via bancor after the purchase to ensure the incoming transfer can cover it
   asset ram_purchase_cost = eosiosystem::ramcostwithfee(ram_purchase_amount, EOS);
   check(quantity.amount >= ram_purchase_cost.amount,
         "The amount sent does not cover the RAM purchase cost (requires " + ram_purchase_cost.to_string() + ")");

   // Calculate any remaining tokens from the transfer after the RAM purchase
   int64_t remainder = quantity.amount - ram_purchase_cost.amount;

   // Return any remaining tokens to the sender
   if (remainder > 0) {
      action{permission_level{_self, "active"_n}, "eosio.token"_n, "transfer"_n,
             std::tuple<name, name, asset, std::string>{_self, from, asset{remainder, EOS}, ""}}
         .send();
   }

   //    {
   //       uint32_t seeds;
   //       asset    cost;
   //       asset    refund;
   //    };

   return {
      (uint32_t)amount,      // seeds bought
      epoch,                 // epoch
      ram_purchase_cost,     // cost
      asset{remainder, EOS}, // refund
      new_seeds_total,       // total seeds
      new_seeds_epoch,       // epoch seeds
   };
}

[[eosio::action]] drops::generate_return_value drops::generatertrn() {}

[[eosio::action]] void drops::transfer(name from, name to, std::vector<uint64_t> to_transfer)
{
   require_auth(from);

   // Retrieve contract state
   state_table state(_self, _self.value);
   auto        state_itr = state.find(1);
   check(state_itr->enabled, "Contract is currently disabled.");

   check(to_transfer.size() > 0, "No seeds were provided to transfer.");

   drops::seeds_table seeds(_self, _self.value);

   for (auto it = begin(to_transfer); it != end(to_transfer); ++it) {
      auto seed_itr = seeds.find(*it);
      check(seed_itr != seeds.end(), "Seed not found");
      check(seed_itr->owner == from, "Account does not own this seed");
      seeds.modify(seed_itr, _self, [&](auto& row) { row.owner = to; });
   }

   accounts_table accounts(_self, _self.value);

   auto account_from_itr = accounts.find(from.value);
   check(account_from_itr != accounts.end(), "From account not found");
   accounts.modify(account_from_itr, _self, [&](auto& row) { row.seeds = row.seeds - to_transfer.size(); });

   auto account_to_itr = accounts.find(to.value);
   if (account_to_itr != accounts.end()) {
      accounts.modify(account_to_itr, _self, [&](auto& row) { row.seeds = row.seeds + to_transfer.size(); });
   } else {
      accounts.emplace(from, [&](auto& row) {
         row.account = to;
         row.seeds   = to_transfer.size();
      });
   }
}

[[eosio::action]] void drops::destroy(name owner, std::vector<uint64_t> to_destroy)
{
   require_auth(owner);

   // Retrieve contract state
   state_table state(_self, _self.value);
   auto        state_itr = state.find(1);
   check(state_itr->enabled, "Contract is currently disabled.");

   check(to_destroy.size() > 0, "No seeds were provided to destroy.");
   //    check(to_destroy.size() <= 100, "Cannot destroy more than 100 at a time.");

   drops::seeds_table seeds(_self, _self.value);

   for (auto it = begin(to_destroy); it != end(to_destroy); ++it) {
      auto seed_itr = seeds.find(*it);
      check(seed_itr != seeds.end(), "Seed not found");
      check(seed_itr->owner == owner, "Account does not own this seed");
      seeds.erase(seed_itr);
   }

   accounts_table accounts(_self, _self.value);
   auto           account_itr = accounts.find(owner.value);
   accounts.modify(account_itr, _self, [&](auto& row) { row.seeds = row.seeds - to_destroy.size(); });

   uint64_t ram_sell_amount   = to_destroy.size() * record_size;
   asset    ram_sell_proceeds = eosiosystem::ramproceedstminusfee(ram_sell_amount, EOS);

   action(permission_level{_self, "active"_n}, "eosio"_n, "sellram"_n, std::make_tuple(_self, ram_sell_amount)).send();

   token::transfer_action transfer_act{"eosio.token"_n, {{_self, "active"_n}}};
   //    check(false, "ram_sell_proceeds: " + ram_sell_proceeds.to_string());
   transfer_act.send(_self, owner, ram_sell_proceeds,
                     "Reclaimed RAM value of " + std::to_string(to_destroy.size()) + " seed(s)");
}

[[eosio::action]] void drops::enroll(name account, uint64_t epoch)
{
   require_auth(account);

   // Determine if this account exists in the accounts table
   accounts_table accounts(_self, _self.value);
   auto           account_itr        = accounts.find(account.value);
   bool           account_row_exists = account_itr != accounts.end();

   // Register the account into the accounts table
   if (!account_row_exists) {
      accounts.emplace(account, [&](auto& row) {
         row.account = account;
         row.seeds   = 0;
      });
   }

   // Determine if this account exists in the epoch stats table for the epoch
   stats_table stats(_self, _self.value);
   auto        stat_idx = stats.get_index<"accountepoch"_n>();
   auto        stat_itr = stat_idx.find((uint128_t)account.value << 64 | epoch);
   check(stat_itr != stat_idx.end(), "This account is already registered for this epoch.");

   stats.emplace(account, [&](auto& row) {
      row.id      = stats.available_primary_key();
      row.account = account;
      row.seeds   = 0;
      row.epoch   = epoch;
   });
}

[[eosio::action]] drops::epoch_row drops::advance()
{
   // Advance the epoch
   auto new_epoch = advance_epoch();

   // Advance until we exist in the current epoch
   while (current_time_point() >= new_epoch.end) {
      new_epoch = advance_epoch();
   }

   // Provide the epoch as a return value
   return new_epoch;
}

[[eosio::action]] void drops::commit(name oracle, uint64_t epoch, checksum256 commit)
{
   require_auth(oracle);

   // Retrieve contract state
   state_table state(_self, _self.value);
   auto        state_itr = state.find(1);
   check(state_itr->enabled, "Contract is currently disabled.");

   drops::oracles_table oracles(_self, _self.value);
   auto                 oracle_itr = oracles.find(oracle.value);
   check(oracle_itr != oracles.end(), "Cannot commit values, not a registered oracle.");

   drops::epochs_table epochs(_self, _self.value);
   auto                epoch_itr = epochs.find(epoch);

   check(epoch_itr != epochs.end(), "Epoch does not exist");

   auto current_time = current_time_point();
   check(current_time > epoch_itr->start, "Epoch not started");
   check(current_time < epoch_itr->end, "Epoch no longer accepting commits");

   drops::commits_table commits(_self, _self.value);
   auto                 commit_idx = commits.get_index<"oracle"_n>();
   auto                 commit_itr = commit_idx.find(oracle.value);
   check(commit_itr == commit_idx.end(), "Oracle has already committed");

   commits.emplace(oracle, [&](auto& row) {
      row.id     = commits.available_primary_key();
      row.epoch  = epoch;
      row.oracle = oracle;
      row.commit = commit;
   });
}

[[eosio::action]] void drops::reveal(name oracle, uint64_t epoch, string reveal)
{
   require_auth(oracle);

   // Retrieve contract state
   state_table state(_self, _self.value);
   auto        state_itr = state.find(1);
   check(state_itr->enabled, "Contract is currently disabled.");

   drops::oracles_table oracles(_self, _self.value);
   auto                 oracle_itr = oracles.find(oracle.value);
   check(oracle_itr != oracles.end(), "Cannot reveal values, not a registered oracle.");

   drops::epochs_table epochs(_self, _self.value);
   auto                epoch_itr = epochs.find(epoch);

   check(epoch_itr != epochs.end(), "Epoch does not exist");

   auto current_time = current_time_point();
   check(current_time > epoch_itr->end, "Epoch has not concluded");
   check(current_time < epoch_itr->reveal, "Reveal phase has completed");

   drops::reveals_table reveals(_self, _self.value);
   auto                 reveal_idx = reveals.get_index<"oracle"_n>();
   auto                 reveal_itr = reveal_idx.find(oracle.value);
   check(reveal_itr == reveal_idx.end(), "Oracle has already revealed");

   drops::commits_table commits(_self, _self.value);
   auto                 commit_idx = commits.get_index<"oracle"_n>();
   auto                 commit_itr = commit_idx.find(oracle.value);
   check(commit_itr != commit_idx.end(), "Oracle never committed");

   checksum256 reveal_hash = sha256(reveal.c_str(), reveal.length());
   auto        reveal_arr  = reveal_hash.extract_as_byte_array();

   checksum256 commit_hash = commit_itr->commit;
   auto        commit_arr  = commit_hash.extract_as_byte_array();

   check(reveal_hash == commit_hash,
         "Reveal value '" + reveal + "' hashes to '" + hexStr(reveal_arr.data(), reveal_arr.size()) +
            "' which does not match commit value '" + hexStr(commit_arr.data(), commit_arr.size()) + "'.");

   reveals.emplace(oracle, [&](auto& row) {
      row.id     = reveals.available_primary_key();
      row.epoch  = epoch;
      row.oracle = oracle;
      row.reveal = reveal;
   });
}

[[eosio::action]] void drops::addoracle(name oracle)
{
   require_auth(_self);

   drops::oracles_table oracles(_self, _self.value);
   oracles.emplace(_self, [&](auto& row) { row.oracle = oracle; });
}

[[eosio::action]] void drops::removeoracle(name oracle)
{
   require_auth(_self);

   drops::oracles_table oracles(_self, _self.value);
   auto                 oracle_itr = oracles.find(oracle.value);
   check(oracle_itr != oracles.end(), "Oracle not found");
   oracles.erase(oracle_itr);
}

[[eosio::action]] void drops::enable(bool enabled)
{
   require_auth(_self);

   drops::state_table state(_self, _self.value);
   auto               state_itr = state.find(1);
   state.modify(state_itr, _self, [&](auto& row) { row.enabled = enabled; });
}

[[eosio::action]] void drops::init()
{
   require_auth(_self);

   accounts_table accounts(_self, _self.value);
   epochs_table   epochs(_self, _self.value);
   seeds_table    seeds(_self, _self.value);
   state_table    state(_self, _self.value);
   stats_table    stats(_self, _self.value);

   accounts.emplace(_self, [&](auto& row) {
      row.account = "eosio"_n;
      row.seeds   = 1;
   });

   epochs.emplace(_self, [&](auto& row) {
      row.epoch    = 1;
      row.start    = current_time_point();
      row.end      = current_time_point() + eosio::seconds(epochphasetimer * 1);
      row.reveal   = current_time_point() + eosio::seconds(epochphasetimer * 2);
      row.complete = current_time_point() + eosio::seconds(epochphasetimer * 3);
   });

   seeds.emplace(_self, [&](auto& row) {
      row.seed  = 0;
      row.owner = "eosio"_n;
      row.epoch = 1;
   });

   state.emplace(_self, [&](auto& row) {
      row.id      = 1;
      row.epoch   = 1;
      row.enabled = false;
   });

   stats.emplace(_self, [&](auto& row) {
      row.id      = 1;
      row.account = "eosio"_n;
      row.epoch   = 1;
      row.seeds   = 1;
   });
}

[[eosio::action]] void drops::wipe()
{
   require_auth(_self);

   drops::accounts_table accounts(_self, _self.value);
   auto                  account_itr = accounts.begin();
   while (account_itr != accounts.end()) {
      account_itr = accounts.erase(account_itr);
   }

   drops::commits_table commits(_self, _self.value);
   auto                 commit_itr = commits.begin();
   while (commit_itr != commits.end()) {
      commit_itr = commits.erase(commit_itr);
   }

   drops::epochs_table epochs(_self, _self.value);
   auto                epoch_itr = epochs.begin();
   while (epoch_itr != epochs.end()) {
      epoch_itr = epochs.erase(epoch_itr);
   }

   drops::reveals_table reveals(_self, _self.value);
   auto                 reveal_itr = reveals.begin();
   while (reveal_itr != reveals.end()) {
      reveal_itr = reveals.erase(reveal_itr);
   }

   drops::seeds_table seeds(_self, _self.value);
   auto               seed_itr = seeds.begin();
   while (seed_itr != seeds.end()) {
      seed_itr = seeds.erase(seed_itr);
   }

   drops::state_table state(_self, _self.value);
   auto               state_itr = state.begin();
   while (state_itr != state.end()) {
      state_itr = state.erase(state_itr);
   }

   drops::stats_table stats(_self, _self.value);
   auto               stats_itr = stats.begin();
   while (stats_itr != stats.end()) {
      stats_itr = stats.erase(stats_itr);
   }
}

[[eosio::action]] void drops::wipesome()
{
   require_auth(_self);
   drops::seeds_table seeds(_self, _self.value);
   auto               seed_itr = seeds.begin();

   int i   = 0;
   int max = 10000;
   while (seed_itr != seeds.end()) {
      if (i++ > max) {
         break;
      }
      i++;
      seed_itr = seeds.erase(seed_itr);
   }
}

std::vector<std::string> drops::split(const std::string& str, char delim)
{
   std::vector<std::string> strings;
   size_t                   start;
   size_t                   end = 0;
   while ((start = str.find_first_not_of(delim, end)) != std::string::npos) {
      end = str.find(delim, start);
      strings.push_back(str.substr(start, end - start));
   }
   return strings;
}

//   ACTION offer(uint64_t seed, name owner, name recipient) {
//     require_auth(owner);

//     offers_table offers(_self, _self.value);
//     seeds_table seeds(_self, _self.value);

//     // Check to ensure owner owns the seed
//     auto seed_itr = seeds.find(seed);
//     check(seed_itr != seeds.end(), "Seed not found");
//     check(seed_itr->owner == owner, "Account does not own this seed");

//     // Create the offer
//     offers.emplace(owner, [&](offer_row &row) {
//       row.seed = seed;
//       row.to = recipient;
//     });
//   }

//   ACTION accept(uint64_t seed, name owner) {
//     require_auth(owner);

//     offers_table offers(_self, _self.value);
//     seeds_table seeds(_self, _self.value);

//     auto offer_itr = offers.find(seed);
//     check(offer_itr != offers.end(), "Offer not found");
//     check(offer_itr->to == owner, "Offer not valid for this account");

//     auto seed_itr = seeds.find(seed);
//     check(seed_itr != seeds.end(), "Seed not found");

//     // Take over RAM payment and set as new owner
//     seeds.modify(seed_itr, owner, [&](auto &row) { row.owner = owner; });

//     // Remove offer once accepted
//     offers.erase(offer_itr);
//   }