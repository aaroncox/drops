#pragma once

#include <eosio.system/eosio.system.hpp>
#include <eosio.token/eosio.token.hpp>

#include <seed.drops/ram.hpp>
#include <seed.drops/seed.drops.hpp>

using namespace eosio;
using namespace std;

namespace drops {

static constexpr name seed_contract   = "seed.gm"_n;   // location of seed contract
static constexpr name oracle_contract = "oracle.gm"_n; // location of oracle contract

// seed table row bytes costs
static constexpr uint64_t primary_row     = 145;                                            // size to create a row
static constexpr uint64_t secondary_index = 144;                                            // size of secondary index
static constexpr uint64_t tertiary_index  = 128;                                            // size of time index
static constexpr uint64_t record_size     = primary_row + secondary_index + tertiary_index; // total record size

// account table row bytes cost
static constexpr uint64_t accounts_row = 124;

// stat table row bytes cost
static constexpr uint64_t stats_row = 412;

// Additional RAM bytes to purchase (buyrambytes bug)
static constexpr uint64_t purchase_buffer = 1;

// static constexpr uint64_t epochphasetimer = 2419200; // 4-week
// static constexpr uint64_t epochphasetimer = 604800; // 1-week
// static constexpr uint64_t epochphasetimer = 86400; // 1-day
// static constexpr uint64_t epochphasetimer = 43200; // 12-hour
// static constexpr uint64_t epochphasetimer = 14400; // 4-hour
static constexpr uint64_t epochphasetimer = 3600; // 1-hour
// static constexpr uint64_t epochphasetimer = 300; // 5-minute
// static constexpr uint64_t epochphasetimer = 60; // 1-minute

static constexpr symbol EOS = symbol{"EOS", 4};

uint128_t combine_ids(const uint64_t& v1, const uint64_t& v2) { return (uint128_t{v1} << 64) | v2; }

class [[eosio::contract("seed.drops")]] seed : public contract
{
public:
   using contract::contract;

   /*

   Tables

   */

   struct [[eosio::table("account")]] account_row
   {
      name     account;
      uint32_t seeds;
      uint64_t primary_key() const { return account.value; }
   };

   struct [[eosio::table("epoch")]] epoch_row
   {
      uint64_t   epoch;
      time_point start;
      time_point end;
      uint64_t   primary_key() const { return epoch; }
   };

   struct [[eosio::table("seed")]] seed_row
   {
      uint64_t          seed;
      uint64_t          epoch;
      name              owner;
      eosio::time_point created;
      bool              soulbound;
      uint64_t          primary_key() const { return seed; }
      uint128_t         by_owner() const { return ((uint128_t)owner.value << 64) | seed; }
      uint64_t          by_created() const { return static_cast<uint64_t>(created.sec_since_epoch()); }
   };

   struct [[eosio::table("state")]] state_row
   {
      uint16_t id;
      uint64_t epoch;
      bool     enabled;
      uint64_t primary_key() const { return id; }
   };

   struct [[eosio::table("stat")]] stat_row
   {
      uint64_t  id;
      name      account;
      uint64_t  epoch;
      uint32_t  seeds;
      uint64_t  primary_key() const { return id; }
      uint64_t  by_account() const { return account.value; }
      uint128_t by_account_epoch() const { return (uint128_t)account.value << 64 | epoch; }
   };

   /*

   Indices

   */

   typedef eosio::multi_index<"account"_n, account_row> account_table;
   typedef eosio::multi_index<"epoch"_n, epoch_row>     epoch_table;
   typedef eosio::multi_index<
      "seed"_n,
      seed_row,
      eosio::indexed_by<"owner"_n, eosio::const_mem_fun<seed_row, uint128_t, &seed_row::by_owner>>,
      eosio::indexed_by<"created"_n, eosio::const_mem_fun<seed_row, uint64_t, &seed_row::by_created>>>
                                                    seed_table;
   typedef eosio::multi_index<"state"_n, state_row> state_table;
   typedef eosio::multi_index<
      "stat"_n,
      stat_row,
      eosio::indexed_by<"account"_n, eosio::const_mem_fun<stat_row, uint64_t, &stat_row::by_account>>,
      eosio::indexed_by<"accountepoch"_n, eosio::const_mem_fun<stat_row, uint128_t, &stat_row::by_account_epoch>>>
      stat_table;

   /*

    Return value structs

   */

   struct generate_return_value
   {
      uint32_t seeds;
      uint64_t epoch;
      asset    cost;
      asset    refund;
      uint64_t total_seeds;
      uint64_t epoch_seeds;
   };

   struct destroy_return_value
   {
      uint64_t ram_sold;
      asset    redeemed;
   };

   /*

    User actions

    */

   [[eosio::on_notify("eosio.token::transfer")]] generate_return_value
   generate(name from, name to, asset quantity, std::string memo);

   [[eosio::action]] generate_return_value mint(name owner, uint32_t amount, std::string data);

   [[eosio::action]] void transfer(name from, name to, std::vector<uint64_t> seed_ids, string memo);

   [[eosio::action]] destroy_return_value destroy(name owner, std::vector<uint64_t> seed_ids, string memo);

   using generate_action = eosio::action_wrapper<"generate"_n, &seed::generate>;
   using mint_action     = eosio::action_wrapper<"mint"_n, &seed::mint>;
   using transfer_action = eosio::action_wrapper<"transfer"_n, &seed::transfer>;
   using destroy_action  = eosio::action_wrapper<"destroy"_n, &seed::destroy>;

   /*

    Epoch actions

    */

   [[eosio::action]] seed::epoch_row advance();
   using advance_action = eosio::action_wrapper<"advance"_n, &seed::advance>;

   /*

    Admin actions

    */

   [[eosio::action]] void enable(bool enabled);
   using enable_action = eosio::action_wrapper<"enable"_n, &seed::enable>;

   [[eosio::action]] void init();
   using init_action = eosio::action_wrapper<"init"_n, &seed::init>;

   // Dummy action that'll help the ABI export the generate_return_value struct
   [[eosio::action]] generate_return_value generatertrn();
   using generatertrn_action = eosio::action_wrapper<"generatertrn"_n, &seed::generatertrn>;

   /*

    Testnet actions

    */

   [[eosio::action]] void wipe();
   using wipe_action = eosio::action_wrapper<"wipe"_n, &seed::wipe>;

   [[eosio::action]] void wipesome();
   using wipesome_action = eosio::action_wrapper<"wipesome"_n, &seed::wipesome>;

   [[eosio::action]] void destroyall();
   using destroyall_action = eosio::action_wrapper<"destroyall"_n, &seed::destroyall>;

private:
   seed::epoch_row          advance_epoch();
   std::vector<std::string> split(const std::string& str, char delim);
};

} // namespace drops
