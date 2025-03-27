#Español
# Prototipo Protocolo Intercambio de Información entre Blockchains
Este repositorio contiene el código del prototipo desarrollado para verificar la factibilidad del protocolo propuesto en la tesis de maestría "Especificación Formal De Un Protocolo Criptográfico De Intercambio De Información Entre Blockchains"

Link de la tesis que contiene la descripción del protocolo: [link tesiunam](http://132.248.9.195/ptd2025/ene_mar/0866365/Index.html)


# Prerequisitos 
1. El código requiere que se tengan descargadas las wallets [Metamask](https://metamask.io/download) y [Phantom](https://phantom.com/download) en el navegador en el que se va a ejecutar las web apps. Se recomienda usar Google Chrome.
   
2. Se deben tener cuatro cuentas en total: dos en la testnet de Sepolia (una para A y otra para pcn) y dos en la devnet de Solana (una para B y otra para pcn). Tratar que todas las cuentas tengan al menos 3 ETH para Sepolia y 3 SOL para Solana.
   
3. Copiar el código del contrato inteligente web-ethereum>smartContracts>ProtocolActionsSCA.sol, editarlo con las direcciones de las cuentas que se vayan a usar y desplegarlo usando Remix, puede seguir el siguente [tutorial para desplegar contratos inteligentes con Remix](https://remix-ide.readthedocs.io/en/latest/create_deploy.html). Una vez desplegado el nuevo contrato inteligente, reemplazar el valor del rotocolActionsABI.jso con el nuevo valor creado.

6. Seguir los pasos para instalar solana y anchor para desplegar contratos inteligentes en Solana y una vez instalado copiar el código del contrato inteligente web-solana>anchor>ProtocolActionsSCB.rs, editarlo con las direcciones de las cuentas que se vayan a usar y desplegarlo en Solana. Se puede seguir este [tutorial para desplegar contratos inteligentes en Solana]([https://www.anchor-lang.com/docs/installation](https://dev.to/edge-and-node/the-complete-guide-to-full-stack-solana-development-with-react-anchor-rust-and-phantom-3291)). Una vez desplegado el nuevo contrato inteligente, reemplazar el valor del idl.json con el nuevo valor.

7. Obtener API Keys de los terceros que se vayan a usar para la comunicación con Ethereum, se puede omitir el uso de terceros, pero se debe modificar el código correspondiente.

8. Crear un archivo .env donde se incluyan los valores de las API keys, los contratos inteligentes y las cuentas, escribiendolos el siguiente formato:
` API KEYS
INFURA_API_KEY=''
ETHER_SCAN_API_KEY=''
ALCHEMY_API_KEY=''
CHAINSTACK_API_KEY=''

 ADDRESSES
USER_A_ETHEREUM_ADDRESS=''
NETWORK_LEADER_ETHEREUM_ADDRESS=''
NETWORK_LEADER_SOLANA_ADDRESS=''
USER_B_SOLANA_ADDRESS=''

 SMART CONTRACTS
SMART_CONTRACT_A_ETHEREUM_ADDRESS=''
SMART_CONTRACT_B_SOLANA_ADDRESS=''
SMART_CONTRACT_B_SOLANA_STATE_ADDRESS=''
`
# Ejecutar el programa

1. Una vez cubiertos los prerequisitos ejecutar el comando `yarn install` y luego el comando `yarn vite`, después copiar los links de localhosts en dos pestañas de su navegador electo y seguir la lógica del protocolo.
