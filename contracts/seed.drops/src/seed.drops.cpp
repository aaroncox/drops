#include "seed.drops/seed.drops.hpp"

namespace drops {

[[eosio::on_notify("eosio.token::transfer")]] seed::generate_return_value
seed::generate(name from, name to, asset quantity, std::string memo)
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

   epoch_table epochs(_self, _self.value);
   auto        epoch_itr = epochs.find(epoch);
   check(epoch_itr != epochs.end(), "Epoch does not exist.");

   time_point epoch_end = epoch_itr->end;

   // Process the memo field to determine the number of seeds to generate
   std::vector<std::string> parsed = split(memo, ',');
   check(parsed.size() == 2, "Memo data must contain 2 values, seperated by a "
                             "comma: amount,seed_data.");

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
   account_table accounts(_self, _self.value);
   auto          account_itr        = accounts.find(from.value);
   bool          account_row_exists = account_itr != accounts.end();

   // First time accounts must purchase the extra ram to persist their stats in
   // memory
   // TODO: Need to decide if we should persist this data or not
   if (!account_row_exists) {
      ram_purchase_amount += accounts_row;
   }

   // Determine if this account exists in the epoch stats table
   stat_table stats(_self, _self.value);
   auto       stat_idx        = stats.get_index<"accountepoch"_n>();
   auto       stat_itr        = stat_idx.find((uint128_t)from.value << 64 | epoch);
   bool       stat_row_exists = stat_itr != stat_idx.end();

   // First time epoch stats must purchase the extra ram to persist their stats
   // in memory
   // TODO: Need to decide if we should persist this data or not
   if (!stat_row_exists) {
      ram_purchase_amount += stats_row;
   }

   // Purchase the RAM
   action(permission_level{_self, "active"_n}, "eosio"_n, "buyrambytes"_n,
          std::make_tuple(_self, _self, ram_purchase_amount))
      .send();

   // Iterate over all seeds to be created and insert them into the seeds table
   seed_table seeds(_self, _self.value);
   for (int i = 0; i < amount; i++) {
      string   value      = std::to_string(i) + data;
      auto     hash       = sha256(value.c_str(), value.length());
      auto     byte_array = hash.extract_as_byte_array();
      uint64_t seed;
      memcpy(&seed, &byte_array, sizeof(uint64_t));
      seeds.emplace(_self, [&](auto& row) {
         row.seed      = seed;
         row.owner     = from;
         row.epoch     = epoch;
         row.soulbound = false;
         row.created   = current_time_point();
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

   // Calculate the purchase cost via bancor after the purchase to ensure the
   // incoming transfer can cover it
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

   return {
      (uint32_t)amount,      // seeds bought
      epoch,                 // epoch
      ram_purchase_cost,     // cost
      asset{remainder, EOS}, // refund
      new_seeds_total,       // total seeds
      new_seeds_epoch,       // epoch seeds
   };
}

[[eosio::action]] seed::generate_return_value seed::mint(name owner, uint32_t amount, std::string data)
{
   require_auth(owner);

   // Retrieve contract state
   state_table state(_self, _self.value);
   auto        state_itr = state.find(1);
   uint64_t    epoch     = state_itr->epoch;
   check(state_itr->enabled, "Contract is currently disabled.");

   epoch_table epochs(_self, _self.value);
   auto        epoch_itr = epochs.find(epoch);
   check(epoch_itr != epochs.end(), "Epoch does not exist.");

   time_point epoch_end = epoch_itr->end;

   // Ensure amount is a positive value
   check(amount > 0, "The amount of seeds to generate must be a positive value.");

   // Ensure string length
   check(data.length() > 32, "Seed data must be at least 32 characters in length.");

   // Determine if this account exists in the accounts table
   account_table accounts(_self, _self.value);
   auto          account_itr        = accounts.find(owner.value);
   bool          account_row_exists = account_itr != accounts.end();

   // Determine if this account exists in the epoch stats table
   stat_table stats(_self, _self.value);
   auto       stat_idx        = stats.get_index<"accountepoch"_n>();
   auto       stat_itr        = stat_idx.find((uint128_t)owner.value << 64 | epoch);
   bool       stat_row_exists = stat_itr != stat_idx.end();

   // Iterate over all seeds to be created and insert them into the seeds table
   seed_table seeds(_self, _self.value);
   for (uint32_t i = 0; i < amount; i++) {
      string   value      = std::to_string(i) + data;
      auto     hash       = sha256(value.c_str(), value.length());
      auto     byte_array = hash.extract_as_byte_array();
      uint64_t seed;
      memcpy(&seed, &byte_array, sizeof(uint64_t));
      seeds.emplace(owner, [&](auto& row) {
         row.seed      = seed;
         row.owner     = owner;
         row.epoch     = epoch;
         row.soulbound = true;
         row.created   = current_time_point();
      });
   }

   // Either update the account row or insert a new row
   uint64_t new_seeds_total = amount;
   if (account_row_exists) {
      new_seeds_total += account_itr->seeds;
      accounts.modify(account_itr, same_payer, [&](auto& row) { row.seeds = new_seeds_total; });
   } else {
      accounts.emplace(owner, [&](auto& row) {
         row.account = owner;
         row.seeds   = new_seeds_total;
      });
   }

   // Either update the stats row or insert a new row
   uint64_t new_seeds_epoch = amount;
   if (stat_row_exists) {
      new_seeds_epoch += stat_itr->seeds;
      stat_idx.modify(stat_itr, same_payer, [&](auto& row) { row.seeds = new_seeds_epoch; });
   } else {
      stats.emplace(owner, [&](auto& row) {
         row.id      = stats.available_primary_key();
         row.account = owner;
         row.seeds   = new_seeds_epoch;
         row.epoch   = epoch;
      });
   }

   return {
      (uint32_t)amount, // seeds bought
      epoch,            // epoch
      asset{0, EOS},    // cost
      asset{0, EOS},    // refund
      new_seeds_total,  // total seeds
      new_seeds_epoch,  // epoch seeds
   };
}

[[eosio::action]] seed::generate_return_value seed::generatertrn() {}

[[eosio::action]] void seed::transfer(name from, name to, std::vector<uint64_t> seed_ids, string memo)
{
   require_auth(from);
   check(is_account(to), "Account does not exist.");
   require_recipient(from);
   require_recipient(to);

   // Retrieve contract state
   state_table state(_self, _self.value);
   auto        state_itr = state.find(1);
   check(state_itr->enabled, "Contract is currently disabled.");

   check(seed_ids.size() > 0, "No seeds were provided to transfer.");

   seed::seed_table seeds(_self, _self.value);

   // Map to record which epochs seeds were destroyed in
   map<uint64_t, uint64_t> epochs_transferred_in;

   for (auto it = begin(seed_ids); it != end(seed_ids); ++it) {
      auto seed_itr = seeds.find(*it);
      check(seed_itr != seeds.end(), "Seed not found");
      check(seed_itr->soulbound == false,
            "Seed " + std::to_string(seed_itr->seed) + " is soulbound and cannot be transferred");
      check(seed_itr->owner == from, "Account does not own this seed");
      // Incremenent the values of all epochs we destroyed seeds in
      if (epochs_transferred_in.find(seed_itr->epoch) == epochs_transferred_in.end()) {
         epochs_transferred_in[seed_itr->epoch] = 1;
      } else {
         epochs_transferred_in[seed_itr->epoch] += 1;
      }
      // Perform the transfer
      seeds.modify(seed_itr, _self, [&](auto& row) { row.owner = to; });
   }

   account_table accounts(_self, _self.value);
   auto          account_from_itr = accounts.find(from.value);
   check(account_from_itr != accounts.end(), "From account not found");
   accounts.modify(account_from_itr, _self, [&](auto& row) { row.seeds = row.seeds - seed_ids.size(); });

   auto account_to_itr = accounts.find(to.value);
   if (account_to_itr != accounts.end()) {
      accounts.modify(account_to_itr, _self, [&](auto& row) { row.seeds = row.seeds + seed_ids.size(); });
   } else {
      accounts.emplace(from, [&](auto& row) {
         row.account = to;
         row.seeds   = seed_ids.size();
      });
   }

   stat_table stats(_self, _self.value);

   // Iterate over map that recorded which epochs were transferred in for from,
   // decrement table values
   for (auto& iter : epochs_transferred_in) {
      auto stat_idx = stats.get_index<"accountepoch"_n>();
      auto stat_itr = stat_idx.find((uint128_t)from.value << 64 | iter.first);
      stat_idx.modify(stat_itr, _self, [&](auto& row) { row.seeds = row.seeds - iter.second; });
   }

   // Iterate over map that recorded which epochs were transferred in for to,
   // increment table values
   for (auto& iter : epochs_transferred_in) {
      auto stat_idx        = stats.get_index<"accountepoch"_n>();
      auto stat_itr        = stat_idx.find((uint128_t)to.value << 64 | iter.first);
      bool stat_row_exists = stat_itr != stat_idx.end();
      if (stat_row_exists) {
         stat_idx.modify(stat_itr, _self, [&](auto& row) { row.seeds = row.seeds + iter.second; });
      } else {
         stats.emplace(from, [&](auto& row) {
            row.id      = stats.available_primary_key();
            row.account = to;
            row.seeds   = iter.second;
            row.epoch   = iter.first;
         });
      }
   }
}

[[eosio::action]] seed::destroy_return_value seed::destroy(name owner, std::vector<uint64_t> seed_ids, string memo)
{
   require_auth(owner);

   // Retrieve contract state
   state_table state(_self, _self.value);
   auto        state_itr = state.find(1);
   check(state_itr->enabled, "Contract is currently disabled.");

   check(seed_ids.size() > 0, "No seeds were provided to destroy.");
   //    check(seed_ids.size() <= 5000, "Cannot destroy more than 5000 at a
   //    time.");

   seed::seed_table seeds(_self, _self.value);

   // Map to record which epochs seeds were destroyed in
   map<uint64_t, uint64_t> epochs_destroyed_in;

   // The number of soulbound seeds that were destroyed
   int soulbound_destroyed = 0;

   // Loop to destroy specified seeds
   for (auto it = begin(seed_ids); it != end(seed_ids); ++it) {
      auto seed_itr = seeds.find(*it);
      check(seed_itr != seeds.end(), "Seed not found");
      check(seed_itr->owner == owner, "Account does not own this seed");
      // Incremenent the values of all epochs we destroyed seeds in
      if (epochs_destroyed_in.find(seed_itr->epoch) == epochs_destroyed_in.end()) {
         epochs_destroyed_in[seed_itr->epoch] = 1;
      } else {
         epochs_destroyed_in[seed_itr->epoch] += 1;
      }
      // Destroy the seed
      seeds.erase(seed_itr);
      // Count the number of soulbound seeds destroyed
      // This will be subtracted from the amount paid out
      if (seed_itr->soulbound) {
         soulbound_destroyed++;
      }
   }

   // Iterate over map that recorded which epochs were destroyed in, decrement
   // table values
   for (auto& iter : epochs_destroyed_in) {
      stat_table stats(_self, _self.value);
      auto       stat_idx = stats.get_index<"accountepoch"_n>();
      auto       stat_itr = stat_idx.find((uint128_t)owner.value << 64 | iter.first);
      stat_idx.modify(stat_itr, _self, [&](auto& row) { row.seeds = row.seeds - iter.second; });
   }

   // Decrement the account row
   account_table accounts(_self, _self.value);
   auto          account_itr = accounts.find(owner.value);
   accounts.modify(account_itr, _self, [&](auto& row) { row.seeds = row.seeds - seed_ids.size(); });

   // Calculate RAM sell amount and proceeds
   uint64_t ram_sell_amount   = (seed_ids.size() - soulbound_destroyed) * record_size;
   asset    ram_sell_proceeds = eosiosystem::ramproceedstminusfee(ram_sell_amount, EOS);
   if (ram_sell_amount > 0) {
      action(permission_level{_self, "active"_n}, "eosio"_n, "sellram"_n, std::make_tuple(_self, ram_sell_amount))
         .send();

      token::transfer_action transfer_act{"eosio.token"_n, {{_self, "active"_n}}};
      transfer_act.send(_self, owner, ram_sell_proceeds,
                        "Reclaimed RAM value of " + std::to_string(seed_ids.size()) + " seed(s)");
   }

   return {
      ram_sell_amount,  // ram sold
      ram_sell_proceeds // redeemed ram value
   };
}

seed::epoch_row seed::advance_epoch()
{
   // Retrieve contract state
   seed::state_table state(_self, _self.value);
   auto              state_itr = state.find(1);
   uint64_t          epoch     = state_itr->epoch;
   check(state_itr->enabled, "Contract is currently disabled.");

   // Retrieve current epoch based on state
   seed::epoch_table epochs(_self, _self.value);
   auto              epoch_itr = epochs.find(epoch);
   check(epoch_itr != epochs.end(), "Epoch " + std::to_string(epoch) + " from state does not exist.");
   check(current_time_point() >= epoch_itr->end, "Current epoch " + std::to_string(epoch) +
                                                    " has not ended for seed contract to advance (" +
                                                    epoch_itr->end.to_string() + ").");

   // Advance epoch number
   uint64_t new_epoch = epoch + 1;

   // Update the epoch in state
   state.modify(state_itr, _self, [&](auto& row) { row.epoch = new_epoch; });

   // Base the next epoch off the current epoch
   time_point new_epoch_start    = epoch_itr->end;
   time_point new_epoch_end      = epoch_itr->end + eosio::seconds(epochphasetimer);
   time_point new_epoch_complete = epoch_itr->end + eosio::seconds(epochphasetimer * 10);

   // Save the next epoch
   epochs.emplace(_self, [&](auto& row) {
      row.epoch = new_epoch;
      row.start = new_epoch_start;
      row.end   = new_epoch_end;
   });

   // Nofify subscribers
   // TODO: Subscribers cannot be notified if they aren't in this contract
   //    seed::subscriber_table subscribers(_self, _self.value);
   //    auto                     subscriber_itr = subscribers.begin();
   //    while (subscriber_itr != subscribers.end()) {
   //       require_recipient(subscriber_itr->subscriber);
   //       subscriber_itr++;
   //    }

   // Return the next epoch
   return {
      new_epoch,       // epoch
      new_epoch_start, // start
      new_epoch_end,   // end
   };
}

[[eosio::action]] seed::epoch_row seed::advance()
{
   // Advance the epoch
   auto new_epoch = advance_epoch();

   // Advance the epoch in the oracle contract
   action(permission_level{_self, "active"_n}, oracle_contract, "advance"_n, std::make_tuple()).send();

   // Provide the epoch as a return value
   return new_epoch;
}

/**
    TESTNET ACTIONS
*/
[[eosio::action]] void seed::destroyall()
{
   require_auth(_self);

   uint64_t            seeds_destroyed = 0;
   map<name, uint64_t> seeds_destroyed_for;

   seed::seed_table seeds(_self, _self.value);
   auto             seed_itr = seeds.begin();
   while (seed_itr != seeds.end()) {
      seeds_destroyed += 1;
      // Keep track of how many seeds were destroyed per owner for debug refund
      if (seeds_destroyed_for.find(seed_itr->owner) == seeds_destroyed_for.end()) {
         seeds_destroyed_for[seed_itr->owner] = 1;
      } else {
         seeds_destroyed_for[seed_itr->owner] += 1;
      }
      seed_itr = seeds.erase(seed_itr);
   }

   seed::account_table accounts(_self, _self.value);
   auto                account_itr = accounts.begin();
   while (account_itr != accounts.end()) {
      account_itr = accounts.erase(account_itr);
   }

   seed::stat_table stats(_self, _self.value);
   auto             stats_itr = stats.begin();
   while (stats_itr != stats.end()) {
      stats_itr = stats.erase(stats_itr);
   }

   // Calculate RAM sell amount
   uint64_t ram_to_sell = seeds_destroyed * record_size;
   action(permission_level{_self, "active"_n}, "eosio"_n, "sellram"_n, std::make_tuple(_self, ram_to_sell)).send();

   for (auto& iter : seeds_destroyed_for) {
      uint64_t ram_sell_amount   = iter.second * record_size;
      asset    ram_sell_proceeds = eosiosystem::ramproceedstminusfee(ram_sell_amount, EOS);

      token::transfer_action transfer_act{"eosio.token"_n, {{_self, "active"_n}}};
      //    check(false, "ram_sell_proceeds: " + ram_sell_proceeds.to_string());
      transfer_act.send(_self, iter.first, ram_sell_proceeds,
                        "Testnet Reset - Reclaimed RAM value of " + std::to_string(iter.second) + " seed(s)");
   }
}

// [[eosio::action]] void seed::enroll(name account, uint64_t epoch)
// {
//    require_auth(account);

//    // Determine if this account exists in the accounts table
//    account_table accounts(_self, _self.value);
//    auto           account_itr        = accounts.find(account.value);
//    bool           account_row_exists = account_itr != accounts.end();

//    // Register the account into the accounts table
//    if (!account_row_exists) {
//       accounts.emplace(account, [&](auto& row) {
//          row.account = account;
//          row.seeds   = 0;
//       });
//    }

//    // Determine if this account exists in the epoch stats table for the epoch
//    stat_table stats(_self, _self.value);
//    auto        stat_idx = stats.get_index<"accountepoch"_n>();
//    auto        stat_itr = stat_idx.find((uint128_t)account.value << 64 | epoch);
//    check(stat_itr != stat_idx.end(), "This account is already registered for this epoch.");

//    stats.emplace(account, [&](auto& row) {
//       row.id      = stats.available_primary_key();
//       row.account = account;
//       row.seeds   = 0;
//       row.epoch   = epoch;
//    });
// }

[[eosio::action]] void seed::enable(bool enabled)
{
   require_auth(_self);

   seed::state_table state(_self, _self.value);
   auto              state_itr = state.find(1);
   state.modify(state_itr, _self, [&](auto& row) { row.enabled = enabled; });
}

[[eosio::action]] void seed::init()
{
   require_auth(_self);

   account_table accounts(_self, _self.value);
   epoch_table   epochs(_self, _self.value);
   seed_table    seeds(_self, _self.value);
   state_table   state(_self, _self.value);
   stat_table    stats(_self, _self.value);

   accounts.emplace(_self, [&](auto& row) {
      row.account = "eosio"_n;
      row.seeds   = 1;
   });

   // Round epoch timer down to nearest interval to start with
   const time_point_sec epoch =
      time_point_sec((current_time_point().sec_since_epoch() / epochphasetimer) * epochphasetimer);

   epochs.emplace(_self, [&](auto& row) {
      row.epoch = 1;
      row.start = epoch;
      row.end   = epoch + eosio::seconds(epochphasetimer);
   });

   seeds.emplace(_self, [&](auto& row) {
      row.seed      = 0;
      row.owner     = "eosio"_n;
      row.epoch     = 1;
      row.soulbound = true;
      row.created   = epoch;
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

[[eosio::action]] void seed::wipe()
{
   require_auth(_self);

   seed::account_table accounts(_self, _self.value);
   auto                account_itr = accounts.begin();
   while (account_itr != accounts.end()) {
      account_itr = accounts.erase(account_itr);
   }

   seed::epoch_table epochs(_self, _self.value);
   auto              epoch_itr = epochs.begin();
   while (epoch_itr != epochs.end()) {
      epoch_itr = epochs.erase(epoch_itr);
   }

   seed::seed_table seeds(_self, _self.value);
   auto             seed_itr = seeds.begin();
   while (seed_itr != seeds.end()) {
      seed_itr = seeds.erase(seed_itr);
   }

   seed::stat_table stats(_self, _self.value);
   auto             stats_itr = stats.begin();
   while (stats_itr != stats.end()) {
      stats_itr = stats.erase(stats_itr);
   }

   seed::state_table state(_self, _self.value);
   auto              state_itr = state.begin();
   while (state_itr != state.end()) {
      state_itr = state.erase(state_itr);
   }
}

[[eosio::action]] void seed::wipesome()
{
   require_auth(_self);
   seed::seed_table seeds(_self, _self.value);
   auto             seed_itr = seeds.begin();

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

std::vector<std::string> seed::split(const std::string& str, char delim)
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

} // namespace drops
