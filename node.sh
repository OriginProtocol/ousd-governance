#!/bin/bash
trap "exit" INT TERM ERR
trap "kill 0" EXIT
nodeWaitTimeout=1200
RED='\033[0;31m'
NO_COLOR='\033[0m'

main()
{
    # rm -rf deployments/localhost
    if  [[ $1 == "fork" ]]
    then
        # Fetch env variables like PROVIDER_URL and BLOCK_NUMBER from .env file so they don't
        # need to be separately set in terminal environment
        ENV_FILE=.env
        source .env
        if [ ! -f "$ENV_FILE" ]; then
            echo -e "${RED} File $ENV_FILE does not exist. Have you forgotten to rename the dev.env to .env? ${NO_COLOR}"
            exit 1
        fi
        if [ -z "$PROVIDER_URL" ]; then echo "Set PROVIDER_URL" && exit 1; fi
        params=()
        params+=(--fork ${PROVIDER_URL})
        if [ -z "$BLOCK_NUMBER" ]; then
            echo "It is recommended that BLOCK_NUMBER is set to a recent block to improve performance of the fork";
        else
            params+=(--fork-block-number ${BLOCK_NUMBER})
        fi

        nodeOutput=$(mktemp "${TMPDIR:-/tmp/}$(basename 0).XXX")
        echo -e "Node logs stored in $nodeOutput"
        # the --no-install is here so npx doesn't download some package on its own if it can not find one in the repo
        FORK=true npx --no-install hardhat node --port 8545 --emoji --show-stack-traces ${params[@]} > $nodeOutput 2>&1 &

        tail -f $nodeOutput &

        i=0
        until grep -q -i 'Started HTTP and WebSocket JSON-RPC server at' $nodeOutput
        do
          let i++
          sleep 1
          if (( i > nodeWaitTimeout )); then
            printf "\n"
            echo "$newLine Node failed to initialize in $nodeWaitTimeout seconds"
            exit 1
          fi
        done
        printf "\n"
        echo "🟢 Node initialized"

        # generate merkle tree
        npm run generate-merkle-tree:dev
        
        # deploy the contracts
        if [ -z "$ACCOUNT_TO_FUND" ]; then
           npm run deploy:contracts:dev
        else
           ACCOUNT_TO_FUND=${ACCOUNT_TO_FUND} npm run deploy:contracts:dev
        fi

        # wait for subprocesses to finish
        for job in `jobs -p`
          do
            wait $job || let "FAIL+=1"
          done


    else
        npx --no-install hardhat node --export '../dapp/network.json'
    fi
}

main "$@"
