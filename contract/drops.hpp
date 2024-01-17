#pragma once

#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <eosio/singleton.hpp>
#include <eosio/system.hpp>
#include <eosio/time.hpp>

#include <optional>
#include <string>

// eosio system
#include <eosio.system/eosio.system.hpp>
#include <eosio.system/exchange_state.hpp>
#include <eosio.token/eosio.token.hpp>

#include "ram.hpp"

using namespace eosio;
using namespace std;

static constexpr uint64_t primary_row     = 136;                           // size to create a row
static constexpr uint64_t secondary_index = 144;                           // size of secondary index
static constexpr uint64_t accounts_row    = 124;                           // size of record in account table
static constexpr uint64_t stats_row       = 412;                           // size of record in stats table
static constexpr uint64_t record_size     = primary_row + secondary_index; // total record size
static constexpr uint64_t purchase_buffer = 1; // Additional RAM bytes to purchase (buyrambytes bug)

uint64_t epochphasetimer = 86400; // 1-day
// uint64_t epochphasetimer = 43200; // 12-hour
// uint64_t epochphasetimer = 14400 // 4-hour
// uint64_t epochphasetimer = 60; // 1-minute

static constexpr symbol EOS = symbol{"EOS", 4};

uint128_t combine_ids(const uint64_t& v1, const uint64_t& v2) { return (uint128_t{v1} << 64) | v2; }

class [[eosio::contract("drops")]] drops : public contract
{
public:
   using contract::contract;

   struct [[eosio::table("accounts")]] account_row
   {
      name     account;
      uint32_t seeds;
      uint64_t primary_key() const { return account.value; }
   };

   typedef eosio::multi_index<"accounts"_n, account_row> accounts_table;

   struct [[eosio::table("epoch")]] epoch_row
   {
      uint64_t   epoch;
      time_point start;
      time_point end;
      time_point reveal;
      time_point complete;
      uint64_t   primary_key() const { return epoch; }
   };

   typedef eosio::multi_index<"epochs"_n, epoch_row> epochs_table;

   struct [[eosio::table("commit")]] commit_row
   {
      uint64_t    id;
      uint64_t    epoch;
      name        oracle;
      checksum256 commit;
      uint64_t    primary_key() const { return id; }
      uint64_t    by_epoch() const { return epoch; }
      uint128_t   by_epochoracle() const { return ((uint128_t)oracle.value << 64) | epoch; }
   };

   typedef eosio::multi_index<
      "commits"_n,
      commit_row,
      eosio::indexed_by<"epoch"_n, eosio::const_mem_fun<commit_row, uint64_t, &commit_row::by_epoch>>,
      eosio::indexed_by<"epochoracle"_n, eosio::const_mem_fun<commit_row, uint128_t, &commit_row::by_epochoracle>>>
      commits_table;

   struct [[eosio::table("oracles")]] oracle_row
   {
      name     oracle;
      uint64_t primary_key() const { return oracle.value; }
   };

   typedef eosio::multi_index<"oracles"_n, oracle_row> oracles_table;

   struct [[eosio::table("reveal")]] reveal_row
   {
      uint64_t  id;
      uint64_t  epoch;
      name      oracle;
      string    reveal;
      uint64_t  primary_key() const { return id; }
      uint64_t  by_epoch() const { return epoch; }
      uint128_t by_epochoracle() const { return ((uint128_t)oracle.value << 64) | epoch; }
   };

   typedef eosio::multi_index<
      "reveals"_n,
      reveal_row,
      eosio::indexed_by<"epoch"_n, eosio::const_mem_fun<reveal_row, uint64_t, &reveal_row::by_epoch>>,
      eosio::indexed_by<"epochoracle"_n, eosio::const_mem_fun<reveal_row, uint128_t, &reveal_row::by_epochoracle>>>
      reveals_table;

   struct [[eosio::table("seeds")]] seed_row
   {
      uint64_t  seed;
      name      owner;
      uint64_t  epoch;
      uint64_t  primary_key() const { return seed; }
      uint128_t by_owner() const { return ((uint128_t)owner.value << 64) | seed; }
      uint64_t  by_epoch() const { return epoch; }
   };

   // Optimized version
   //    struct [[eosio::table("seeds")]] seed_row
   //    {
   //       uint32_t id;
   //       uint64_t seed;
   //       name     owner;
   //       uint16_t epoch;
   //       uint32_t primary_key() const { return seed; }
   //       uint64_t by_owner() const { return owner.value; }
   //       uint16_t by_epoch() const { return epoch; }
   //    };

   typedef eosio::multi_index<
      "seeds"_n,
      seed_row,
      eosio::indexed_by<"owner"_n, eosio::const_mem_fun<seed_row, uint128_t, &seed_row::by_owner>>>
      seeds_table;

   struct [[eosio::table("state")]] state_row
   {
      uint16_t id;
      uint64_t epoch;
      bool     enabled;
      uint64_t primary_key() const { return id; }
   };

   typedef eosio::multi_index<"state"_n, state_row> state_table;

   struct [[eosio::table("stats")]] stat_row
   {
      uint64_t  id;
      name      account;
      uint64_t  epoch;
      uint32_t  seeds;
      uint64_t  primary_key() const { return id; }
      uint64_t  by_account() const { return account.value; }
      uint128_t by_account_epoch() const { return (uint128_t)account.value << 64 | epoch; }
   };

   typedef eosio::multi_index<
      "stats"_n,
      stat_row,
      eosio::indexed_by<"account"_n, eosio::const_mem_fun<stat_row, uint64_t, &stat_row::by_account>>,
      eosio::indexed_by<"accountepoch"_n, eosio::const_mem_fun<stat_row, uint128_t, &stat_row::by_account_epoch>>>
      stats_table;

   /*
    User actions
   */
   [[eosio::action]] void transfer(name from, name to, std::vector<uint64_t> seed_ids, string memo);
   using transfer_action = eosio::action_wrapper<"transfer"_n, &drops::transfer>;

   [[eosio::action]] void enroll(name account, uint64_t epoch);
   using enroll_action = eosio::action_wrapper<"enroll"_n, &drops::enroll>;

   struct destroy_return_value
   {
      uint64_t ram_sold;
      asset    redeemed;
   };

   [[eosio::action]] destroy_return_value destroy(name owner, std::vector<uint64_t> seed_ids, string memo);
   using destroy_action = eosio::action_wrapper<"destroy"_n, &drops::destroy>;

   // DEBUGGING ACTION
   [[eosio::action]] void destroyall();
   using destroyall_action = eosio::action_wrapper<"destroyall"_n, &drops::destroyall>;

   struct generate_return_value
   {
      uint32_t seeds;
      uint64_t epoch;
      asset    cost;
      asset    refund;
      uint64_t total_seeds;
      uint64_t epoch_seeds;
   };

   [[eosio::on_notify("eosio.token::transfer")]] generate_return_value
   generate(name from, name to, asset quantity, std::string memo);
   using generate_action = eosio::action_wrapper<"generate"_n, &drops::generate>;

   // Dummy action that'll help the ABI export the generate_return_value struct
   [[eosio::action]] generate_return_value generatertrn();
   using generatertrn_action = eosio::action_wrapper<"generatertrn"_n, &drops::generatertrn>;

   /*
    Oracle actions
   */
   [[eosio::action]] drops::epoch_row advance();
   using advance_action = eosio::action_wrapper<"advance"_n, &drops::advance>;

   [[eosio::action]] void commit(name oracle, uint64_t epoch, checksum256 commit);
   using commit_action = eosio::action_wrapper<"commit"_n, &drops::commit>;

   [[eosio::action]] void reveal(name oracle, uint64_t epoch, string reveal);
   using reveal_action = eosio::action_wrapper<"reveal"_n, &drops::reveal>;

   /*
    Admin actions
   */
   [[eosio::action]] void addoracle(name oracle);
   using addoracle_action = eosio::action_wrapper<"addoracle"_n, &drops::addoracle>;

   [[eosio::action]] void removeoracle(name oracle);
   using removeoracle_action = eosio::action_wrapper<"removeoracle"_n, &drops::removeoracle>;

   [[eosio::action]] void enable(bool enabled);
   using enable_action = eosio::action_wrapper<"enable"_n, &drops::enable>;

   [[eosio::action]] void init();
   using init_action = eosio::action_wrapper<"init"_n, &drops::init>;

   [[eosio::action]] void wipe();
   using wipe_action = eosio::action_wrapper<"wipe"_n, &drops::wipe>;

   [[eosio::action]] void wipesome();
   using wipesome_action = eosio::action_wrapper<"wipesome"_n, &drops::wipesome>;

   /*
    Computation helpers
   */
   [[eosio::action]] checksum256 compute(uint64_t epoch, uint64_t seed);
   using compute_action = eosio::action_wrapper<"compute"_n, &drops::compute>;

   checksum256 compute_epoch_value(uint64_t epoch, uint64_t seed);

private:
   drops::epoch_row         advance_epoch();
   std::vector<std::string> split(const std::string& str, char delim);
};