#pragma once

#include <eosio/eosio.hpp>

using namespace eosio;

class [[eosio::contract("drops")]] drops_api : public contract
{
public:
   using contract::contract;

   struct api_response
   {
      uint64_t foo;
   };

   [[eosio::action, eosio::read_only]] api_response callapi();
   using callapi_action = eosio::action_wrapper<"callapi"_n, &drops_api::callapi>;
};