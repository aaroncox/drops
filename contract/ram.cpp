#include <cmath>
#include <eosio.system/eosio.system.hpp>

namespace eosiosystem {

using eosio::asset;

int64_t get_bancor_input(int64_t out_reserve, int64_t inp_reserve, int64_t out)
{
   const double ob = out_reserve;
   const double ib = inp_reserve;

   int64_t inp = (ib * out) / (ob - out);

   if (inp < 0)
      inp = 0;

   return inp;
}

int64_t get_bancor_output(int64_t inp_reserve, int64_t out_reserve, int64_t inp)
{
   const double ib = inp_reserve;
   const double ob = out_reserve;
   const double in = inp;

   int64_t out = int64_t((in * ob) / (ib + in));

   if (out < 0)
      out = 0;

   return out;
}

// asset direct_convert(const asset& from, const symbol& to)
// {
//    name      system_account = "eosio"_n;
//    rammarket _rammarket(system_account, system_account.value);
//    auto      itr = _rammarket.find(system_contract::ramcore_symbol.raw());

//    const auto& sell_symbol  = from.symbol;
//    const auto& base_symbol  = itr->base.balance.symbol;
//    const auto& quote_symbol = itr->quote.balance.symbol;
//    check(sell_symbol != to, "cannot convert to the same symbol");

//    asset out(0, to);
//    if (sell_symbol == base_symbol && to == quote_symbol) {
//       out.amount = get_bancor_output(itr->base.balance.amount, itr->quote.balance.amount, from.amount);
//    } else if (sell_symbol == quote_symbol && to == base_symbol) {
//       out.amount = get_bancor_output(itr->quote.balance.amount, itr->base.balance.amount, from.amount);
//    } else {
//       check(false, "invalid conversion");
//    }
//    return out;
// }

double round_to(double value, double precision = 1.0, bool up = false)
{
   if (up) {
      return std::ceil(value / precision) * precision;
   } else {
      return std::floor(value / precision) * precision;
   }
}

asset ramcost(uint32_t bytes, symbol core_symbol)
{
   name          system_account = "eosio"_n;
   rammarket     _rammarket(system_account, system_account.value);
   auto          itr         = _rammarket.find(system_contract::ramcore_symbol.raw());
   const int64_t ram_reserve = itr->base.balance.amount;
   const int64_t eos_reserve = itr->quote.balance.amount;
   const int64_t cost        = get_bancor_input(ram_reserve, eos_reserve, bytes);
   return asset{cost, core_symbol};
}

asset ramcostwithfee(uint32_t bytes, symbol core_symbol)
{
   const asset   cost          = ramcost(bytes, core_symbol);
   const int64_t cost_plus_fee = cost.amount / double(0.995);
   return asset{cost_plus_fee, core_symbol};
}

// asset direct_convert(const asset& from, const symbol& to)
asset ramproceedstminusfee(uint32_t bytes, symbol core_symbol)
{
   asset from = asset{bytes, system_contract::ram_symbol};

   symbol    to             = core_symbol;
   name      system_account = "eosio"_n;
   rammarket _rammarket(system_account, system_account.value);
   auto      itr = _rammarket.find(system_contract::ramcore_symbol.raw());

   const auto& sell_symbol  = from.symbol;
   const auto& base_symbol  = itr->base.balance.symbol;
   const auto& quote_symbol = itr->quote.balance.symbol;
   check(sell_symbol != to, "cannot convert to the same symbol");

   asset out(0, to);
   if (sell_symbol == base_symbol && to == quote_symbol) {
      out.amount = get_bancor_output(itr->base.balance.amount, itr->quote.balance.amount, from.amount);
   } else if (sell_symbol == quote_symbol && to == base_symbol) {
      out.amount = get_bancor_output(itr->quote.balance.amount, itr->base.balance.amount, from.amount);
   } else {
      check(false, "invalid conversion");
   }

   const int64_t cost_minus_fee = out.amount * double(0.995);
   return asset{cost_minus_fee, core_symbol};

   //    _rammarket.modify(itr, same_payer, [&](auto& es) {
   //       /// the cast to int64_t of bytes is safe because we certify bytes is <= quota which is limited by prior
   //       purchases tokens_out = es.direct_convert(asset(bytes, ram_symbol), core_symbol());
   //    });

   //    name          system_account = "eosio"_n;
   //    rammarket     _rammarket(system_account, system_account.value);
   //    auto          itr         = _rammarket.find(system_contract::ramcore_symbol.raw());
   //    const int64_t ram_reserve = itr->base.balance.amount;
   //    const int64_t eos_reserve = itr->quote.balance.amount;
   //    const int64_t cost        = get_bancor_input(ram_reserve, eos_reserve, bytes);

   //    //    const asset   cost           = ramcost(bytes, core_symbol);
   //    const int64_t cost_minus_fee = cost.amount * double(0.995) - 0.0001;
   //    return tokens_out;
}

} // namespace eosiosystem