#include "oracle.drops/oracle.drops.hpp"

namespace dropssystem {

checksum256 oracle::compute_epoch_value(uint64_t epoch)
{
   // Load the epoch and ensure all secrets have been revealed
   drops::epoch_table epochs(drops_contract, drops_contract.value);
   auto               epoch_itr = epochs.find(epoch);
   check(epoch_itr != epochs.end(), "Epoch does not exist");
   // TODO: Check a value to ensure the epoch has been completely revealed

   // Load all reveal values for the epoch
   oracle::reveal_table reveal_table(_self, _self.value);
   auto                 reveal_idx = reveal_table.get_index<"epoch"_n>();
   auto                 reveal_itr = reveal_idx.find(epoch);
   check(reveal_itr != reveal_idx.end(), "Epoch has no reveal values?");

   // Accumulator for all reveal values
   std::vector<std::string> reveals;

   // Iterate over reveals and build a vector containing them all
   while (reveal_itr != reveal_idx.end() && reveal_itr->epoch == epoch) {
      reveals.push_back(reveal_itr->reveal);
      reveal_itr++;
   }

   // Sort the reveal values alphebetically for consistency
   sort(reveals.begin(), reveals.end());

   // Combine the epoch, drops, and reveals into a single string
   string result = std::to_string(epoch);
   for (const auto& reveal : reveals)
      result += reveal;

   // Generate the sha256 value of the combined string
   return sha256(result.c_str(), result.length());
}

checksum256 oracle::compute_epoch_drops_value(uint64_t epoch, uint64_t seed)
{
   // Load the drops
   drops::drop_table drops(drops_contract, drops_contract.value);
   auto              drops_itr = drops.find(seed);
   check(drops_itr != drops.end(), "Drop not found");

   // Ensure this drops was valid for the given epoch
   // A drops must be created before or during the provided epoch
   check(drops_itr->epoch <= epoch, "Drop was generated after this epoch and is not valid for computation.");

   // Load the epoch drops value
   oracle::epoch_table oracle_epoch(_self, _self.value);
   auto                epoch_itr = oracle_epoch.find(epoch);
   check(epoch_itr != oracle_epoch.end(), "Epoch has not yet been resolved.");

   // Generate the sha256 value of the combined string
   return oracle::hash(epoch_itr->drops, seed);
}

checksum256 oracle::compute_last_epoch_drops_value(uint64_t drops)
{
   // Load current state
   drops::state_table state(drops_contract, drops_contract.value);
   auto               state_itr = state.find(1);
   uint64_t           epoch     = state_itr->epoch;
   // Set to previous epoch
   uint64_t last_epoch = epoch - 1;
   // Return value for the last epoch
   return compute_epoch_drops_value(last_epoch, drops);
}

[[eosio::action]] checksum256 oracle::computedrops(uint64_t epoch, uint64_t drops)
{
   return compute_epoch_drops_value(epoch, drops);
}

[[eosio::action]] checksum256 oracle::computeepoch(uint64_t epoch) { return compute_epoch_value(epoch); }

[[eosio::action]] checksum256 oracle::cmplastepoch(uint64_t drops, name contract)
{
   require_recipient(contract);
   return compute_last_epoch_drops_value(drops);
}

[[eosio::action]] void oracle::commit(name oracle, uint64_t epoch, checksum256 commit)
{
   require_auth(oracle);

   // Retrieve drops contract state
   drops::state_table state(drops_contract, drops_contract.value);
   auto               state_itr = state.find(1);
   check(state_itr->enabled, "Contract is currently disabled.");

   // Automatically advance if needed
   ensure_epoch_advance(*state_itr);

   // Retrieve oracle contract epoch
   oracle::epoch_table epochoracles(_self, _self.value);
   auto                epochoracles_itr = epochoracles.find(epoch);
   check(epochoracles_itr != epochoracles.end(), "Epoch does not exist in oracle contract");
   check(std::find(epochoracles_itr->oracles.begin(), epochoracles_itr->oracles.end(), oracle) !=
            epochoracles_itr->oracles.end(),
         "Oracle is not in the list of oracles for this epoch");

   oracle::commit_table commits(_self, _self.value);
   auto                 commit_idx = commits.get_index<"epochoracle"_n>();
   auto                 commit_itr = commit_idx.find(((uint128_t)oracle.value << 64) + epoch);
   check(commit_itr == commit_idx.end(), "Oracle has already committed");

   commits.emplace(_self, [&](auto& row) {
      row.id     = commits.available_primary_key();
      row.epoch  = epoch;
      row.oracle = oracle;
      row.commit = commit;
   });
}

void oracle::ensure_epoch_advance(drops::state_row state)
{
   // Attempt to find current epoch from state in oracle contract
   oracle::epoch_table epochs(_self, _self.value);
   auto                epochs_itr = epochs.find(state.epoch);

   // If the epoch does not exist in the oracle contract, advance the epoch
   if (epochs_itr == epochs.end()) {
      oracle::epoch_row new_epoch = oracle::advance_epoch();
   }
}

[[eosio::action]] void oracle::reveal(name oracle, uint64_t epoch, string reveal)
{
   require_auth(oracle);

   // Retrieve contract state from drops contract
   drops::state_table state(drops_contract, drops_contract.value);
   auto               state_itr = state.find(1);
   check(state_itr->enabled, "Contract is currently disabled.");

   // Automatically advance if needed
   ensure_epoch_advance(*state_itr);

   // Retrieve epoch from drops contract
   drops::epoch_table epochs(drops_contract, drops_contract.value);
   auto               epoch_itr = epochs.find(epoch);
   check(epoch_itr != epochs.end(), "Epoch does not exist");
   auto current_time = current_time_point();
   check(current_time > epoch_itr->end, "Epoch has not concluded");

   // Retrieve epoch from oracle contract
   oracle::epoch_table epochoracles(_self, _self.value);
   auto                epochoracles_itr = epochoracles.find(epoch);
   check(epochoracles_itr != epochoracles.end(), "Oracle Epoch does not exist");

   oracle::reveal_table reveals(_self, _self.value);
   auto                 reveal_idx = reveals.get_index<"epochoracle"_n>();
   auto                 reveal_itr = reveal_idx.find(((uint128_t)oracle.value << 64) + epoch);
   check(reveal_itr == reveal_idx.end(), "Oracle has already revealed");

   oracle::commit_table commits(_self, _self.value);
   auto                 commit_idx = commits.get_index<"epochoracle"_n>();
   auto                 commit_itr = commit_idx.find(((uint128_t)oracle.value << 64) + epoch);
   check(commit_itr != commit_idx.end(), "Oracle never committed");

   checksum256 reveal_hash = sha256(reveal.c_str(), reveal.length());
   auto        reveal_arr  = reveal_hash.extract_as_byte_array();

   checksum256 commit_hash = commit_itr->commit;
   auto        commit_arr  = commit_hash.extract_as_byte_array();

   check(reveal_hash == commit_hash,
         "Reveal value '" + reveal + "' hashes to '" + hexStr(reveal_arr.data(), reveal_arr.size()) +
            "' which does not match commit value '" + hexStr(commit_arr.data(), commit_arr.size()) + "'.");

   reveals.emplace(_self, [&](auto& row) {
      row.id     = reveals.available_primary_key();
      row.epoch  = epoch;
      row.oracle = oracle;
      row.reveal = reveal;
   });

   // TODO: This logic is the exact same as finishreveal, should be refactored
   vector<name> has_revealed;
   auto         completed_reveals_idx = reveals.get_index<"epochoracle"_n>();
   for (name oracle : epochoracles_itr->oracles) {
      auto completed_reveals_itr = completed_reveals_idx.find(((uint128_t)oracle.value << 64) + epoch);
      if (completed_reveals_itr != completed_reveals_idx.end()) {
         has_revealed.push_back(oracle);
      }
   }
   if (has_revealed.size() == epochoracles_itr->oracles.size()) {
      // Complete the epoch
      epochoracles.modify(epochoracles_itr, _self, [&](auto& row) {
         row.completed = 1;
         row.drops     = compute_epoch_value(epoch);
      });
   }

   // TODO: Create an administrative action that can force an Epoch completed if an oracle fails to reveal.
}

[[eosio::action]] void oracle::finishreveal(uint64_t epoch)
{
   drops::epoch_table epochs(drops_contract, drops_contract.value);
   auto               epoch_itr = epochs.find(epoch);
   check(epoch_itr != epochs.end(), "Epoch does not exist");

   oracle::epoch_table epochoracles(_self, _self.value);
   auto                epochoracles_itr = epochoracles.find(epoch);
   check(epochoracles_itr != epochoracles.end(), "Oracle Epoch does not exist");

   vector<name>         has_revealed;
   oracle::reveal_table reveals(_self, _self.value);
   auto                 reveals_idx = reveals.get_index<"epochoracle"_n>();
   for (name oracle : epochoracles_itr->oracles) {
      auto completed_reveals_itr = reveals_idx.find(((uint128_t)oracle.value << 64) + epoch);
      if (completed_reveals_itr != reveals_idx.end()) {
         has_revealed.push_back(oracle);
      }
   }

   if (has_revealed.size() == epochoracles_itr->oracles.size()) {
      // Complete the epoch
      epochoracles.modify(epochoracles_itr, _self, [&](auto& row) {
         row.completed = 1;
         row.drops     = compute_epoch_value(epoch);
      });
   }
}

[[eosio::action]] void oracle::addoracle(name oracle)
{
   require_auth(_self);
   check(is_account(oracle), "Account does not exist.");
   oracle::oracle_table oracles(_self, _self.value);
   oracles.emplace(_self, [&](auto& row) { row.oracle = oracle; });
}

[[eosio::action]] void oracle::removeoracle(name oracle)
{
   require_auth(_self);

   oracle::oracle_table oracles(_self, _self.value);
   auto                 oracle_itr = oracles.find(oracle.value);
   check(oracle_itr != oracles.end(), "Oracle not found");
   oracles.erase(oracle_itr);
}

[[eosio::action]] void oracle::subscribe(name subscriber)
{
   // TODO: Maybe this needs to require the oracles or _self?
   // The person advancing I think needs to pay for the CPU to notify the other contracts
   require_auth(_self);

   oracle::subscriber_table subscribers(_self, _self.value);
   auto                     subscriber_itr = subscribers.find(subscriber.value);
   check(subscriber_itr == subscribers.end(), "Already subscribed to notifictions.");
   subscribers.emplace(_self, [&](auto& row) { row.subscriber = subscriber; });
}

[[eosio::action]] void oracle::unsubscribe(name subscriber)
{
   require_auth(subscriber);

   oracle::subscriber_table subscribers(_self, _self.value);
   auto                     subscriber_itr = subscribers.find(subscriber.value);
   check(subscriber_itr != subscribers.end(), "Not currently subscribed.");
   subscribers.erase(subscriber_itr);
}

[[eosio::action]] void oracle::init()
{
   require_auth(_self);

   drops::epoch_table   drops_epochs(drops_contract, drops_contract.value);
   oracle::epoch_table  oracle_epochs(_self, _self.value);
   oracle::oracle_table oracle_table(_self, _self.value);

   // Load the epoch from the drops contract
   auto drops_epoch_itr = drops_epochs.find(1);
   check(drops_epoch_itr != drops_epochs.end(), "Epoch 1 in drops contract does not exist.");

   // Load the epoch from the oracle contract
   auto oracle_epoch_itr = oracle_epochs.find(1);
   check(oracle_epoch_itr == oracle_epochs.end(), "Epoch 1 in oracle contract already exists.");

   // Load oracles to initialize the first epoch
   std::vector<name> oracles;
   auto              oracle_itr = oracle_table.begin();
   check(oracle_itr != oracle_table.end(), "No oracles registered, cannot init.");
   while (oracle_itr != oracle_table.end()) {
      oracles.push_back(oracle_itr->oracle);
      oracle_itr++;
   }

   // Add the epoch row to the oracle contract
   oracle_epochs.emplace(_self, [&](auto& row) {
      row.epoch     = 1;
      row.oracles   = oracles;
      row.completed = 0;
   });
}

[[eosio::action]] void oracle::wipe()
{
   require_auth(_self);

   oracle::commit_table commits(_self, _self.value);
   auto                 commit_itr = commits.begin();
   while (commit_itr != commits.end()) {
      commit_itr = commits.erase(commit_itr);
   }

   oracle::epoch_table epochs(_self, _self.value);
   auto                epoch_itr = epochs.begin();
   while (epoch_itr != epochs.end()) {
      epoch_itr = epochs.erase(epoch_itr);
   }

   oracle::reveal_table reveals(_self, _self.value);
   auto                 reveal_itr = reveals.begin();
   while (reveal_itr != reveals.end()) {
      reveal_itr = reveals.erase(reveal_itr);
   }

   oracle::oracle_table oracles(_self, _self.value);
   auto                 oracle_itr = oracles.begin();
   while (oracle_itr != oracles.end()) {
      oracle_itr = oracles.erase(oracle_itr);
   }

   oracle::subscriber_table subscribers(_self, _self.value);
   auto                     subscribers_itr = subscribers.begin();
   while (subscribers_itr != subscribers.end()) {
      subscribers_itr = subscribers.erase(subscribers_itr);
   }
}

oracle::epoch_row oracle::advance_epoch()
{
   // Retrieve drops contract state
   drops::state_table state(drops_contract, drops_contract.value);
   auto               state_itr = state.find(1);
   uint64_t           epoch     = state_itr->epoch;
   check(state_itr->enabled, "Contract is currently disabled.");

   // Retrieve current epoch from drops contract
   drops::epoch_table drops_epochs(drops_contract, drops_contract.value);
   auto               drops_epochs_itr = drops_epochs.find(epoch);
   check(drops_epochs_itr != drops_epochs.end(),
         "Epoch " + std::to_string(epoch) + " from drops contract state does not exist.");

   // Retrieve current epoch from oracle contract
   oracle::epoch_table oracle_epochs(_self, _self.value);
   auto                oracle_epochs_itr = oracle_epochs.find(epoch);
   check(oracle_epochs_itr == oracle_epochs.end(),
         "Epoch " + std::to_string(epoch) + " from oracle contract state already exists.");

   // Find currently active oracles
   std::vector<name>    oracles;
   oracle::oracle_table oracle_table(_self, _self.value);
   auto                 oracle_itr = oracle_table.begin();
   check(oracle_itr != oracle_table.end(), "No oracles registered, cannot init.");
   while (oracle_itr != oracle_table.end()) {
      oracles.push_back(oracle_itr->oracle);
      oracle_itr++;
   }

   // Save the next epoch to the oracle contract
   oracle_epochs.emplace(_self, [&](auto& row) {
      row.epoch     = epoch;
      row.oracles   = oracles;
      row.completed = 0;
   });

   // Nofify subscribers
   oracle::subscriber_table subscribers(_self, _self.value);
   auto                     subscriber_itr = subscribers.begin();
   while (subscriber_itr != subscribers.end()) {
      require_recipient(subscriber_itr->subscriber);
      subscriber_itr++;
   }

   // Return the next epoch
   return {
      epoch,   // epoch
      oracles, // oracles
      0        // completed
   };
}

[[eosio::action]] oracle::epoch_row oracle::advance()
{
   // Only the drops contract can advance the oracle contract
   require_auth(_self);

   // Advance the epoch
   auto new_epoch = advance_epoch();

   // Provide the epoch as a return value
   return new_epoch;
}

} // namespace dropssystem
