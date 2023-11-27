# Makefile to build the zwave protocol binding
DIST_FOLDER=./dist
BUILD_FOLDER=./build
INSTALL_HOME=~/bin/hiveot
BINDINGS_HOME=$(INSTALL_HOME)/plugins
.DEFAULT_GOAL := help

.FORCE:

all: dist

build: .FORCE  ## Compile typescript
	npx tsc && npx tsc-alias

dist: ## Build binary app using pkg and esbuild
	tsc
	pkg --compress GZip .

clean: ## Clear build and cache
	rm -rf node_modules
	rm -rf dist/*
	rm -rf build/*
	yarn

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:   ## Install the plugin into $(INSTALL_HOME)
	mkdir -p $(BINDINGS_HOME)
	cp $(DIST_FOLDER)/* $(BINDINGS_HOME)

run: js ## Compile and run the app
	node ${BUILD_FOLDER}/main.js  ~/bin/hiveot/certs


upgrade: ## Upgrade packages (use with care)
	go get -u all
	go mod tidy
