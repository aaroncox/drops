BIN := ./node_modules/.bin

.EXPORT_ALL_VARIABLES:
CONTRACT ?= drops
CONTRACT_ACCOUNT ?= testing.gm
CONTRACTS_PREFIX = ../reference-contracts/contracts
LEAP_PREFIX = ../leap
INCLUDES = -I contracts/seed.drops/include -I contracts/oracle.drops/include
NODE_URL ?= https://jungle4.greymass.com
REV := $(shell git rev-parse --short HEAD)
BRANCH := $(shell echo $${HEAD:-$$(git branch --show-current)})

CONTRACT_SEED = seed.drops
CONTRACT_SEED_ACCOUNT = seed.gm

CONTRACT_ORACLE = oracle.drops
CONTRACT_ORACLE_ACCOUNT = oracle.gm

# Wharf

codegen/oracle:
	npx @wharfkit/cli generate --json contracts/$(CONTRACT_SEED)/build/$(CONTRACT_SEED).abi --url $(NODE_URL) $(CONTRACT_SEED_ACCOUNT) -f oracle/src/lib/contracts/$(CONTRACT_SEED).ts
	npx @wharfkit/cli generate --json contracts/$(CONTRACT_ORACLE)/build/$(CONTRACT_ORACLE).abi --url $(NODE_URL) $(CONTRACT_ORACLE_ACCOUNT) -f oracle/src/lib/contracts/$(CONTRACT_ORACLE).ts

codegen/webapp:
	npx @wharfkit/cli generate --json contracts/$(CONTRACT_SEED)/build/$(CONTRACT_SEED).abi --url $(NODE_URL) $(CONTRACT_SEED_ACCOUNT) -f webapp/src/lib/contracts/$(CONTRACT_SEED).ts
	npx @wharfkit/cli generate --json contracts/$(CONTRACT_ORACLE)/build/$(CONTRACT_ORACLE).abi --url $(NODE_URL) $(CONTRACT_ORACLE_ACCOUNT) -f webapp/src/lib/contracts/$(CONTRACT_ORACLE).ts

# SEED CONTRACT

contract/seed: contract/seed/build contract/seed/publish

contract/seed/build:
	cdt-cpp -abigen -abigen_output=contracts/seed.drops/build/seed.drops.abi -o contracts/seed.drops/build/seed.drops.wasm -O3 contracts/seed.drops/src/seed.drops.cpp contracts/seed.drops/src/ram.cpp $(INCLUDES)

contract/seed/publish:
	cleos -u $(NODE_URL) set contract $(CONTRACT_SEED_ACCOUNT) \
		contracts/seed.drops/build/ ${CONTRACT_SEED}.wasm ${CONTRACT_SEED}.abi

contract/seed/reset: contract/seed/build contract/seed/wipe contract/seed/publish contract/seed/wipe contract/seed/init contract/seed/enable

contract/seed/init:
	cleos -u $(NODE_URL) push action $(CONTRACT_SEED_ACCOUNT) init "{}" -p "$(CONTRACT_SEED_ACCOUNT)@active"

contract/seed/wipe:
	cleos -u $(NODE_URL) push action $(CONTRACT_SEED_ACCOUNT) wipe "{}" -p "$(CONTRACT_SEED_ACCOUNT)@active"

contract/seed/enable:
	cleos -u $(NODE_URL) push action $(CONTRACT_SEED_ACCOUNT) enable '{"enabled": true}' -p "$(CONTRACT_SEED_ACCOUNT)@active"

contract/seed/advance:
	cleos -u $(NODE_URL) push action $(CONTRACT_SEED_ACCOUNT) advance '{}' -p "$(CONTRACT_SEED_ACCOUNT)@active"

# ORACLE CONTRACT

contract/oracle: contract/oracle/build contract/oracle/publish

contract/oracle/build:
	cdt-cpp -abigen -abigen_output=contracts/oracle.drops/build/oracle.drops.abi -o contracts/oracle.drops/build/oracle.drops.wasm -O3 contracts/oracle.drops/src/oracle.drops.cpp $(INCLUDES)

contract/oracle/publish:
	cleos -u $(NODE_URL) set contract $(CONTRACT_ORACLE_ACCOUNT) \
		contracts/oracle.drops/build/ ${CONTRACT_ORACLE}.wasm ${CONTRACT_ORACLE}.abi

contract/oracle/reset: contract/oracle/build contract/oracle/wipe contract/oracle/publish contract/oracle/wipe contract/oracle/addoracles contract/oracle/init contract/oracle/subscribe

contract/oracle/init:
	cleos -u $(NODE_URL) push action $(CONTRACT_ORACLE_ACCOUNT) init "{}" -p "$(CONTRACT_ORACLE_ACCOUNT)@active"

contract/oracle/wipe:
	cleos -u $(NODE_URL) push action $(CONTRACT_ORACLE_ACCOUNT) wipe "{}" -p "$(CONTRACT_ORACLE_ACCOUNT)@active"

contract/oracle/addoracles: contract/oracle/addoracle1 contract/oracle/addoracle2 contract/oracle/addoracle3

contract/oracle/addoracle1:
	cleos -u $(NODE_URL) push action $(CONTRACT_ORACLE_ACCOUNT) addoracle '{"oracle": "oracle1.gm"}' -p "$(CONTRACT_ORACLE_ACCOUNT)@active"

contract/oracle/addoracle2:
	cleos -u $(NODE_URL) push action $(CONTRACT_ORACLE_ACCOUNT) addoracle '{"oracle": "oracle2.gm"}' -p "$(CONTRACT_ORACLE_ACCOUNT)@active"

contract/oracle/addoracle3:
	cleos -u $(NODE_URL) push action $(CONTRACT_ORACLE_ACCOUNT) addoracle '{"oracle": "oracle3.gm"}' -p "$(CONTRACT_ORACLE_ACCOUNT)@active"

contract/oracle/advance:
	cleos -u $(NODE_URL) push action $(CONTRACT_ORACLE_ACCOUNT) advance '{}' -p "$(CONTRACT_ORACLE_ACCOUNT)@active"

contract/oracle/subscribe:
	cleos -u $(NODE_URL) push action $(CONTRACT_ORACLE_ACCOUNT) subscribe '{"subscriber": "token.gm"}' -p "$(CONTRACT_ORACLE_ACCOUNT)@active"


# OLD ACTIONS

.PHONY: build
build: contract webapp
dev:
	yarn --cwd webapp/ dev

oracledev:
	bun run --watch oracle/src/index.ts

.PHONY: webapp
webapp:
	yarn --cwd webapp/ build

contract/%.abi: contract/%.cpp contract/%.contracts.md
	cdt-cpp -abigen -abigen_output=contract/build/drops.abi -o contract/build/drops.wasm -O3 contract/api.cpp contract/drops.cpp contract/ram.cpp $(INCLUDES)

src/contract-types.ts: contract/$(CONTRACT).abi
	${BIN}/abi2core <$< > types/contract-types.ts

.PHONY: contract
contract: contract/$(CONTRACT).abi

.PHONY: testnet
testnet: contract testnetwipe publishtestnet testnetinit

.PHONY: publish
publish:
	cleos -u $(NODE_URL) set contract \
		$(CONTRACT_ACCOUNT) contract/ ${CONTRACT}.wasm ${CONTRACT}.abi

.PHONY: publishtestnet
publishtestnet:
	cleos -u $(NODE_URL) set contract \
		$(CONTRACT_ACCOUNT) contract/build/ ${CONTRACT}.wasm ${CONTRACT}.abi

.PHONY: testnetnotify
testnetnotify:
	cleos -u $(NODE_URL) push action testing.gm cmplastepoch '{"seed": "88285382042718202", "contract": "token.gm"}' -p "testing.gm@active"

.PHONY: testnetwipe
testnetwipe:
	cleos -u $(NODE_URL) push action testing.gm wipe "{}" -p "testing.gm@active"

.PHONY: testnetwipesome
testnetwipesome:
	cleos -u $(NODE_URL) push action testing.gm wipesome "{}" -p "testing.gm@active"

.PHONY: testnetinit
testnetinit:
	cleos -u $(NODE_URL) push action testing.gm init "{}" -p "testing.gm@active"

.PHONY: testnetaddoracle
testnetaddoracle:
	cleos -u $(NODE_URL) push action testing.gm addoracle '{"oracle": "wharfkittest"}' -p "testing.gm@active"

.PHONY: testnetaddoracle2
testnetaddoracle2:
	cleos -u $(NODE_URL) push action testing.gm addoracle '{"oracle": "wharfkit1111"}' -p "testing.gm@active"

.PHONY: testnetaddoracle3
testnetaddoracle3:
	cleos -u $(NODE_URL) push action testing.gm addoracle '{"oracle": "wharfkit2111"}' -p "testing.gm@active"

.PHONY: testnetremoveoracle
testnetremoveoracle:
	cleos -u $(NODE_URL) push action testing.gm removeoracle '{"oracle": "wharfkittest"}' -p "testing.gm@active"

.PHONY: testnetremoveoracle2
testnetremoveoracle2:
	cleos -u $(NODE_URL) push action testing.gm removeoracle '{"oracle": "wharfkit1111"}' -p "testing.gm@active"

.PHONY: testnetremoveoracle3
testnetremoveoracle3:
	cleos -u $(NODE_URL) push action testing.gm removeoracle '{"oracle": "wharfkit2111"}' -p "testing.gm@active"

.PHONY: testnetenable
testnetenable:
	cleos -u $(NODE_URL) push action testing.gm enable '{"enabled": true}' -p "testing.gm@active"

.PHONY: testnetdestroyall
testnetdestroyall:
	cleos -u $(NODE_URL) push action testing.gm destroyall '{}' -p "testing.gm@active"

.PHONY: testnetdisable
testnetdisable:
	cleos -u $(NODE_URL) push action testing.gm enable '{"enabled": false}' -p "testing.gm@active"

.PHONY: testnetadvance
testnetadvance:
	cleos -u $(NODE_URL) push action testing.gm advance '{}' -p "testing.gm@active"

.PHONY: testnetreset
testnetreset: testnetwipe testnetinit

.PHONY: clean
clean:
	rm -contract/build/*.wasm
	rm -contract/build/*.abi
	rm -rf webapp/build/
	rm -f types/contract-types.ts
