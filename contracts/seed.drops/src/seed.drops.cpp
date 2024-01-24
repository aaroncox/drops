#include "seed.drops/seed.drops.hpp"

namespace dropssystem {

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

   epoch_table epochs(_self, _self.value);
   auto        epoch_itr = epochs.find(epoch);
   check(epoch_itr != epochs.end(), "Epoch does not exist.");

   time_point epoch_end = epoch_itr->end;

   // Process the memo field to determine the number of drops to generate
   std::vector<std::string> parsed = split(memo, ',');
   check(parsed.size() == 2, "Memo data must contain 2 values, seperated by a "
                             "comma: amount,drops_data.");

   // Ensure amount is a positive value
   int amount = stoi(parsed[0]);
   check(amount > 0, "The amount of drops to generate must be a positive value.");

   // Ensure string length
   string data = parsed[1];
   check(data.length() > 32, "Drop data must be at least 32 characters in length.");

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

   // Iterate over all drops to be created and insert them into the drops table
   drop_table drops(_self, _self.value);
   for (int i = 0; i < amount; i++) {
      string   value      = std::to_string(i) + data;
      auto     hash       = sha256(value.c_str(), value.length());
      auto     byte_array = hash.extract_as_byte_array();
      uint64_t seed;
      memcpy(&seed, &byte_array, sizeof(uint64_t));
      drops.emplace(_self, [&](auto& row) {
         row.seed    = seed;
         row.owner   = from;
         row.epoch   = epoch;
         row.bound   = false;
         row.created = current_time_point();
      });
   }

   // Either update the account row or insert a new row
   uint64_t new_drops_total = amount;
   if (account_row_exists) {
      new_drops_total += account_itr->drops;
      accounts.modify(account_itr, _self, [&](auto& row) { row.drops = new_drops_total; });
   } else {
      accounts.emplace(_self, [&](auto& row) {
         row.account = from;
         row.drops   = new_drops_total;
      });
   }

   // Either update the stats row or insert a new row
   uint64_t new_drops_epoch = amount;
   if (stat_row_exists) {
      new_drops_epoch += stat_itr->drops;
      stat_idx.modify(stat_itr, _self, [&](auto& row) { row.drops = new_drops_epoch; });
   } else {
      stats.emplace(_self, [&](auto& row) {
         row.id      = stats.available_primary_key();
         row.account = from;
         row.drops   = new_drops_epoch;
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
      (uint32_t)amount,      // drops bought
      epoch,                 // epoch
      ram_purchase_cost,     // cost
      asset{remainder, EOS}, // refund
      new_drops_total,       // total drops
      new_drops_epoch,       // epoch drops
   };
}

[[eosio::action]] drops::generate_return_value drops::mint(name owner, uint32_t amount, std::string data)
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
   check(amount > 0, "The amount of drops to generate must be a positive value.");

   // Ensure string length
   check(data.length() > 32, "Drop data must be at least 32 characters in length.");

   // Determine if this account exists in the accounts table
   account_table accounts(_self, _self.value);
   auto          account_itr        = accounts.find(owner.value);
   bool          account_row_exists = account_itr != accounts.end();

   // Determine if this account exists in the epoch stats table
   stat_table stats(_self, _self.value);
   auto       stat_idx        = stats.get_index<"accountepoch"_n>();
   auto       stat_itr        = stat_idx.find((uint128_t)owner.value << 64 | epoch);
   bool       stat_row_exists = stat_itr != stat_idx.end();

   // Iterate over all drops to be created and insert them into the drops table
   drop_table drops(_self, _self.value);
   for (uint32_t i = 0; i < amount; i++) {
      string   value      = std::to_string(i) + data;
      auto     hash       = sha256(value.c_str(), value.length());
      auto     byte_array = hash.extract_as_byte_array();
      uint64_t seed;
      memcpy(&seed, &byte_array, sizeof(uint64_t));
      drops.emplace(owner, [&](auto& row) {
         row.seed    = seed;
         row.owner   = owner;
         row.epoch   = epoch;
         row.bound   = true;
         row.created = current_time_point();
      });
   }

   // Either update the account row or insert a new row
   uint64_t new_drops_total = amount;
   if (account_row_exists) {
      new_drops_total += account_itr->drops;
      accounts.modify(account_itr, same_payer, [&](auto& row) { row.drops = new_drops_total; });
   } else {
      accounts.emplace(owner, [&](auto& row) {
         row.account = owner;
         row.drops   = new_drops_total;
      });
   }

   // Either update the stats row or insert a new row
   uint64_t new_drops_epoch = amount;
   if (stat_row_exists) {
      new_drops_epoch += stat_itr->drops;
      stat_idx.modify(stat_itr, same_payer, [&](auto& row) { row.drops = new_drops_epoch; });
   } else {
      stats.emplace(owner, [&](auto& row) {
         row.id      = stats.available_primary_key();
         row.account = owner;
         row.drops   = new_drops_epoch;
         row.epoch   = epoch;
      });
   }

   return {
      (uint32_t)amount, // drops bought
      epoch,            // epoch
      asset{0, EOS},    // cost
      asset{0, EOS},    // refund
      new_drops_total,  // total drops
      new_drops_epoch,  // epoch drops
   };
}

[[eosio::action]] drops::generate_return_value drops::generatertrn() {}

[[eosio::action]] void drops::transfer(name from, name to, std::vector<uint64_t> drops_ids, string memo)
{
   require_auth(from);
   check(is_account(to), "Account does not exist.");
   require_recipient(from);
   require_recipient(to);

   // Retrieve contract state
   state_table state(_self, _self.value);
   auto        state_itr = state.find(1);
   check(state_itr->enabled, "Contract is currently disabled.");

   check(drops_ids.size() > 0, "No drops were provided to transfer.");

   drops::drop_table drops(_self, _self.value);

   // Map to record which epochs drops were destroyed in
   map<uint64_t, uint64_t> epochs_transferred_in;

   for (auto it = begin(drops_ids); it != end(drops_ids); ++it) {
      auto drops_itr = drops.find(*it);
      check(drops_itr != drops.end(), "Drop not found");
      check(drops_itr->bound == false,
            "Drop " + std::to_string(drops_itr->seed) + " is bound and cannot be transferred");
      check(drops_itr->owner == from, "Account does not own this drops");
      // Incremenent the values of all epochs we destroyed drops in
      if (epochs_transferred_in.find(drops_itr->epoch) == epochs_transferred_in.end()) {
         epochs_transferred_in[drops_itr->epoch] = 1;
      } else {
         epochs_transferred_in[drops_itr->epoch] += 1;
      }
      // Perform the transfer
      drops.modify(drops_itr, _self, [&](auto& row) { row.owner = to; });
   }

   account_table accounts(_self, _self.value);
   auto          account_from_itr = accounts.find(from.value);
   check(account_from_itr != accounts.end(), "From account not found");
   accounts.modify(account_from_itr, _self, [&](auto& row) { row.drops = row.drops - drops_ids.size(); });

   auto account_to_itr = accounts.find(to.value);
   if (account_to_itr != accounts.end()) {
      accounts.modify(account_to_itr, _self, [&](auto& row) { row.drops = row.drops + drops_ids.size(); });
   } else {
      accounts.emplace(from, [&](auto& row) {
         row.account = to;
         row.drops   = drops_ids.size();
      });
   }

   stat_table stats(_self, _self.value);

   // Iterate over map that recorded which epochs were transferred in for from,
   // decrement table values
   for (auto& iter : epochs_transferred_in) {
      auto stat_idx = stats.get_index<"accountepoch"_n>();
      auto stat_itr = stat_idx.find((uint128_t)from.value << 64 | iter.first);
      stat_idx.modify(stat_itr, _self, [&](auto& row) { row.drops = row.drops - iter.second; });
   }

   // Iterate over map that recorded which epochs were transferred in for to,
   // increment table values
   for (auto& iter : epochs_transferred_in) {
      auto stat_idx        = stats.get_index<"accountepoch"_n>();
      auto stat_itr        = stat_idx.find((uint128_t)to.value << 64 | iter.first);
      bool stat_row_exists = stat_itr != stat_idx.end();
      if (stat_row_exists) {
         stat_idx.modify(stat_itr, _self, [&](auto& row) { row.drops = row.drops + iter.second; });
      } else {
         stats.emplace(from, [&](auto& row) {
            row.id      = stats.available_primary_key();
            row.account = to;
            row.drops   = iter.second;
            row.epoch   = iter.first;
         });
      }
   }
}

[[eosio::action]] drops::destroy_return_value drops::destroy(name owner, std::vector<uint64_t> drops_ids, string memo)
{
   require_auth(owner);

   // Retrieve contract state
   state_table state(_self, _self.value);
   auto        state_itr = state.find(1);
   check(state_itr->enabled, "Contract is currently disabled.");

   check(drops_ids.size() > 0, "No drops were provided to destroy.");
   //    check(drops_ids.size() <= 5000, "Cannot destroy more than 5000 at a
   //    time.");

   drops::drop_table drops(_self, _self.value);

   // Map to record which epochs drops were destroyed in
   map<uint64_t, uint64_t> epochs_destroyed_in;

   // The number of bound drops that were destroyed
   int bound_destroyed = 0;

   // Loop to destroy specified drops
   for (auto it = begin(drops_ids); it != end(drops_ids); ++it) {
      auto drops_itr = drops.find(*it);
      check(drops_itr != drops.end(), "Drop not found");
      check(drops_itr->owner == owner, "Account does not own this drops");
      // Incremenent the values of all epochs we destroyed drops in
      if (epochs_destroyed_in.find(drops_itr->epoch) == epochs_destroyed_in.end()) {
         epochs_destroyed_in[drops_itr->epoch] = 1;
      } else {
         epochs_destroyed_in[drops_itr->epoch] += 1;
      }
      // Destroy the drops
      drops.erase(drops_itr);
      // Count the number of bound drops destroyed
      // This will be subtracted from the amount paid out
      if (drops_itr->bound) {
         bound_destroyed++;
      }
   }

   // Iterate over map that recorded which epochs were destroyed in, decrement
   // table values
   for (auto& iter : epochs_destroyed_in) {
      stat_table stats(_self, _self.value);
      auto       stat_idx = stats.get_index<"accountepoch"_n>();
      auto       stat_itr = stat_idx.find((uint128_t)owner.value << 64 | iter.first);
      stat_idx.modify(stat_itr, _self, [&](auto& row) { row.drops = row.drops - iter.second; });
   }

   // Decrement the account row
   account_table accounts(_self, _self.value);
   auto          account_itr = accounts.find(owner.value);
   accounts.modify(account_itr, _self, [&](auto& row) { row.drops = row.drops - drops_ids.size(); });

   // Calculate RAM sell amount and proceeds
   uint64_t ram_sell_amount   = (drops_ids.size() - bound_destroyed) * record_size;
   asset    ram_sell_proceeds = eosiosystem::ramproceedstminusfee(ram_sell_amount, EOS);
   if (ram_sell_amount > 0) {
      action(permission_level{_self, "active"_n}, "eosio"_n, "sellram"_n, std::make_tuple(_self, ram_sell_amount))
         .send();

      token::transfer_action transfer_act{"eosio.token"_n, {{_self, "active"_n}}};
      transfer_act.send(_self, owner, ram_sell_proceeds,
                        "Reclaimed RAM value of " + std::to_string(drops_ids.size()) + " drops(s)");
   }

   return {
      ram_sell_amount,  // ram sold
      ram_sell_proceeds // redeemed ram value
   };
}

drops::epoch_row drops::advance_epoch()
{
   // Retrieve contract state
   drops::state_table state(_self, _self.value);
   auto               state_itr = state.find(1);
   uint64_t           epoch     = state_itr->epoch;
   check(state_itr->enabled, "Contract is currently disabled.");

   // Retrieve current epoch based on state
   drops::epoch_table epochs(_self, _self.value);
   auto               epoch_itr = epochs.find(epoch);
   check(epoch_itr != epochs.end(), "Epoch " + std::to_string(epoch) + " from state does not exist.");
   check(current_time_point() >= epoch_itr->end, "Current epoch " + std::to_string(epoch) +
                                                    " has not ended for drops contract to advance (" +
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
   //    drops::subscriber_table subscribers(_self, _self.value);
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

[[eosio::action]] drops::epoch_row drops::advance()
{
   // Advance the epoch
   auto new_epoch = advance_epoch();

   // Provide the epoch as a return value
   return new_epoch;
}

/**
    TESTNET ACTIONS
*/
[[eosio::action]] void drops::destroyall()
{
   require_auth(_self);

   uint64_t            drops_destroyed = 0;
   map<name, uint64_t> drops_destroyed_for;

   drops::drop_table drops(_self, _self.value);
   auto              drops_itr = drops.begin();
   while (drops_itr != drops.end()) {
      drops_destroyed += 1;
      // Keep track of how many drops were destroyed per owner for debug refund
      if (drops_destroyed_for.find(drops_itr->owner) == drops_destroyed_for.end()) {
         drops_destroyed_for[drops_itr->owner] = 1;
      } else {
         drops_destroyed_for[drops_itr->owner] += 1;
      }
      drops_itr = drops.erase(drops_itr);
   }

   drops::account_table accounts(_self, _self.value);
   auto                 account_itr = accounts.begin();
   while (account_itr != accounts.end()) {
      account_itr = accounts.erase(account_itr);
   }

   drops::stat_table stats(_self, _self.value);
   auto              stats_itr = stats.begin();
   while (stats_itr != stats.end()) {
      stats_itr = stats.erase(stats_itr);
   }

   // Calculate RAM sell amount
   uint64_t ram_to_sell = drops_destroyed * record_size;
   action(permission_level{_self, "active"_n}, "eosio"_n, "sellram"_n, std::make_tuple(_self, ram_to_sell)).send();

   for (auto& iter : drops_destroyed_for) {
      uint64_t ram_sell_amount   = iter.second * record_size;
      asset    ram_sell_proceeds = eosiosystem::ramproceedstminusfee(ram_sell_amount, EOS);

      token::transfer_action transfer_act{"eosio.token"_n, {{_self, "active"_n}}};
      //    check(false, "ram_sell_proceeds: " + ram_sell_proceeds.to_string());
      transfer_act.send(_self, iter.first, ram_sell_proceeds,
                        "Testnet Reset - Reclaimed RAM value of " + std::to_string(iter.second) + " drops(s)");
   }
}

// [[eosio::action]] void drops::enroll(name account, uint64_t epoch)
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
//          row.drops   = 0;
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
//       row.drops   = 0;
//       row.epoch   = epoch;
//    });
// }

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

   account_table accounts(_self, _self.value);
   epoch_table   epochs(_self, _self.value);
   drop_table    drops(_self, _self.value);
   state_table   state(_self, _self.value);
   stat_table    stats(_self, _self.value);

   // Round epoch timer down to nearest interval to start with
   const time_point_sec epoch =
      time_point_sec((current_time_point().sec_since_epoch() / epochphasetimer) * epochphasetimer);

   // Establish the first epoch
   epochs.emplace(_self, [&](auto& row) {
      row.epoch = 1;
      row.start = epoch;
      row.end   = epoch + eosio::seconds(epochphasetimer);
   });

   // Give system contract the 0 drops
   drops.emplace(_self, [&](auto& row) {
      row.seed    = 0;
      row.owner   = "eosio"_n;
      row.epoch   = 1;
      row.bound   = true;
      row.created = epoch;
   });

   accounts.emplace(_self, [&](auto& row) {
      row.account = "eosio"_n;
      row.drops   = 1;
   });

   stats.emplace(_self, [&](auto& row) {
      row.id      = 1;
      row.account = "eosio"_n;
      row.epoch   = 1;
      row.drops   = 1;
   });

   // Give Greymass the "Greymass" drops
   drops.emplace(_self, [&](auto& row) {
      row.seed    = 7338027470446133248;
      row.owner   = "teamgreymass"_n;
      row.epoch   = 1;
      row.bound   = true;
      row.created = epoch;
   });

   accounts.emplace(_self, [&](auto& row) {
      row.account = "teamgreymass"_n;
      row.drops   = 1;
   });

   stats.emplace(_self, [&](auto& row) {
      row.id      = 2;
      row.account = "teamgreymass"_n;
      row.epoch   = 1;
      row.drops   = 1;
   });

   // Set the current state to epoch 1
   state.emplace(_self, [&](auto& row) {
      row.id      = 1;
      row.epoch   = 1;
      row.enabled = false;
   });
}

[[eosio::action]] void drops::wipe()
{
   require_auth(_self);

   drops::account_table accounts(_self, _self.value);
   auto                 account_itr = accounts.begin();
   while (account_itr != accounts.end()) {
      account_itr = accounts.erase(account_itr);
   }

   drops::epoch_table epochs(_self, _self.value);
   auto               epoch_itr = epochs.begin();
   while (epoch_itr != epochs.end()) {
      epoch_itr = epochs.erase(epoch_itr);
   }

   drops::drop_table drops(_self, _self.value);
   auto              drops_itr = drops.begin();
   while (drops_itr != drops.end()) {
      drops_itr = drops.erase(drops_itr);
   }

   drops::stat_table stats(_self, _self.value);
   auto              stats_itr = stats.begin();
   while (stats_itr != stats.end()) {
      stats_itr = stats.erase(stats_itr);
   }

   drops::state_table state(_self, _self.value);
   auto               state_itr = state.begin();
   while (state_itr != state.end()) {
      state_itr = state.erase(state_itr);
   }
}

[[eosio::action]] void drops::wipesome()
{
   require_auth(_self);
   drops::drop_table drops(_self, _self.value);
   auto              drops_itr = drops.begin();

   int i   = 0;
   int max = 10000;
   while (drops_itr != drops.end()) {
      if (i++ > max) {
         break;
      }
      i++;
      drops_itr = drops.erase(drops_itr);
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

} // namespace dropssystem
