BIN := ./node_modules/.bin

.EXPORT_ALL_VARIABLES:
CONTRACT ?= drops
CONTRACT_ACCOUNT ?= testing.gm
CONTRACTS_PREFIX = ../reference-contracts/contracts
LEAP_PREFIX = ../leap
INCLUDES = -I contract/include
NODE_URL ?= https://jungle4.greymass.com
REV := $(shell git rev-parse --short HEAD)
BRANCH := $(shell echo $${HEAD:-$$(git branch --show-current)})

.PHONY: build
build: contract webapp

codegen:
	npx @wharfkit/cli generate --json contract/build/drops.abi --url https://jungle4.greymass.com testing.gm -f webapp/src/lib/contracts/drops.ts

dev:
	yarn --cwd webapp/ dev

.PHONY: webapp
webapp:
	yarn --cwd webapp/ build

contract/%.abi: contract/%.cpp contract/%.contracts.md
	cdt-cpp -abigen -abigen_output=contract/build/drops.abi -o contract/build/drops.wasm -O3 contract/drops.cpp contract/ram.cpp $(INCLUDES)

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

.PHONY: testnetremoveoracle
testnetremoveoracle:
	cleos -u $(NODE_URL) push action testing.gm removeoracle '{"oracle": "wharfkittest"}' -p "testing.gm@active"

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
