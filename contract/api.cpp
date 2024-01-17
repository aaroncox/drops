#pragma once

#include "api.hpp"

[[eosio::action, eosio::read_only]] drops_api::api_response drops_api::callapi()
{
   // do things
   return {(uint64_t)1};
}
