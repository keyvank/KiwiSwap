import { ethers } from "ethers"

// Add this enum at the top of the file
export enum NetworkType {
  MAINNET = "mainnet",
  TESTNET = "testnet",
}

// Define separate contract addresses for mainnet and testnet
export const CONTRACT_ADDRESSES = {
  [NetworkType.MAINNET]: {
    POOL_MANAGER: "0x7FB53Bc979C7bDd1a31797DEC8eAD92ca3469538",
    // Add other contract addresses for mainnet if needed
  },
  [NetworkType.TESTNET]: {
    POOL_MANAGER: "0x32Cf1f3a98aeAF57b88b3740875D19912A522c1A", // Example testnet address
    // Add other contract addresses for testnet if needed
  },
}

// Replace the existing ZANJIR_NETWORK constant with this
export const NETWORK_CONFIGS = {
  [NetworkType.MAINNET]: {
    chainId: "0x2f147",
    chainName: "Zanjir",
    nativeCurrency: {
      name: "USDT",
      symbol: "USDT",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.zanjir.xyz"],
    blockExplorerUrls: ["https://zanjir.xyz/explorer"],
  },
  [NetworkType.TESTNET]: {
    chainId: "0x2f148",
    chainName: "Zanjir Testnet",
    nativeCurrency: {
      name: "USDT",
      symbol: "USDT",
      decimals: 18,
    },
    rpcUrls: ["https://rpc-testnet.zanjir.xyz:443"],
    blockExplorerUrls: ["https://zanjir.xyz/explorer"],
  },
}

// Add a variable to track the current network
let currentNetwork = NetworkType.MAINNET

// Add a function to get the current network configuration
export function getZanjirNetwork() {
  return NETWORK_CONFIGS[currentNetwork]
}

export function getCurrentContractAddresses() {
  return CONTRACT_ADDRESSES[currentNetwork]
}
// Add a function to set the current network
export function setNetwork(networkType: NetworkType) {
  currentNetwork = networkType
  // Return the new network config
  return getZanjirNetwork()
}

// Add a function to get the current network type
export function getCurrentNetworkType() {
  return currentNetwork
}

// اطلاعات شبکه Zanjir
// export const ZANJIR_NETWORK = {
//   chainId: "0x2f147",
//   chainName: "Zanjir",
//   nativeCurrency: {
//     name: "USDT",
//     symbol: "USDT",
//     decimals: 18,
//   },
//   rpcUrls: ["https://rpc.zanjir.xyz"],
//   blockExplorerUrls: ["https://zanjir.xyz/explorer"],
// }

export function getPoolManagerAddress() {
  return CONTRACT_ADDRESSES[currentNetwork].POOL_MANAGER
}
// ABI برای قرارداد مدیریت استخر
export const POOL_MANAGER_ABI = [
  "function getPool(address _tokenA, address _tokenB) public view returns (address)",
  "function createPoolIfNotExists(address _tokenA, address _tokenB) external returns (address)",
  "function createTokenAndPool(address quoteToken, string memory name, string memory symbol, uint256 totalSupply, uint256 baseAmount, uint256 quoteAmount) external returns (address)",
  "event PoolCreated(address tokenA, address tokenB, address pool)",
  "event TokenCreated(address token)",
  "event TokenApproved(address token)",
]

// ABI برای قرارداد BasicPool
export const BASIC_POOL_ABI = [
  "function addLiquidity(uint256 amountADesired, uint256 amountBDesired) external returns (uint256)",
  "function calculateRemoveLiquidity(uint256 liquidity) public view returns (uint256 amountA, uint256 amountB)",
  "function removeLiquidity(uint256 liquidity) external returns (uint256 amountA, uint256 amountB)",
  "function swapAForB(uint256 amountAIn, uint256 minAmountBOut) external returns (uint256)",
  "function swapBForA(uint256 amountBIn, uint256 minAmountAOut) external returns (uint256)",
  "function calculateSwapAForB(uint256 amountAIn) public view returns (uint256)",
  "function calculateSwapBForA(uint256 amountBIn) public view returns (uint256)",
  "function approxAForB(uint256 amountIn) public view returns (uint256 amountOut)",
  "function approxBForA(uint256 amountIn) public view returns (uint256 amountOut)",
  "function getExchangeRate() external view returns (uint256, uint256)",
  "function reserveA() view returns (uint256)",
  "function reserveB() view returns (uint256)",
  "function tokenA() view returns (address)",
  "function tokenB() view returns (address)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "event Swap(address indexed user, bool isAToB, uint256 amountIn, uint256 amountOut)",
]

// ABI برای توکن‌های ERC20
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
]


// آدرس‌های توکن‌های مشخص شده
export const TOKEN_ADDRESSES = {
  SOL: "0x36E6dc3CF44FDb8C62c5a11B457A28041f4C6eEF",
  ETH: "0x681E99A09Db2Be1da8dc54b1504eB81fD6F3724e",
  USDT: "0x9ac37093d6eF6cb5fC0944DCed3AA56eBCE050cb",
  IRT: "0x09E5DCF3872DD653c4CCA5378AbA77088457A8a9",
  DOGE: "0xC7d2B19934594c43b6ec678507Df24D49e7e2F69",
  BTC: "0x3B05FB2fA2AE1447f61A0456f102350626A69f0b",
  AMOU: "0xC9b4C81e4511b109Fb41eB9C055b619D102761d2",
}

// Add a cache for token symbols to avoid repeated calls to the contract
const tokenSymbolCache: Record<string, string> = {}

// Add a function to get token symbol from contract address
export async function getTokenSymbol(tokenAddress: string): Promise<string> {
  // Check if symbol is already in cache
  if (tokenSymbolCache[tokenAddress.toLowerCase()]) {
    return tokenSymbolCache[tokenAddress.toLowerCase()]
  }

  try {
    // Connect to token contract
    const tokenContract = await connectToToken(tokenAddress)

    // Get symbol from contract
    const symbol = await tokenContract.symbol()

    // Cache the result
    tokenSymbolCache[tokenAddress.toLowerCase()] = symbol

    return symbol
  } catch (error) {
    console.error("Error fetching token symbol:", error)
    // Return address as fallback
    return tokenAddress.substring(0, 6) + "..." + tokenAddress.substring(tokenAddress.length - 4)
  }
}

// بررسی اتصال به شبکه Zanjir
// Update the checkZanjirNetwork function
export async function checkZanjirNetwork() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask یا کیف پول سازگار با Web3 یافت نشد")
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" })
    return chainId === getZanjirNetwork().chainId
  } catch (error) {
    console.error("خطا در بررسی شبکه:", error)
    return false
  }
}

// افزودن شبکه Zanjir به MetaMask
// Update the addZanjirNetwork function
export async function addZanjirNetwork() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask یا کیف پول سازگار با Web3 یافت نشد")
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [getZanjirNetwork()],
    })
    return true
  } catch (error) {
    console.error("خطا در افزودن شبکه Zanjir:", error)
    throw error
  }
}

// تغییر شبکه به Zanjir
// Update the switchToZanjirNetwork function to use the current network config

// Update the switchToZanjirNetwork function to reflect the selected network type
export async function switchToZanjirNetwork() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask یا کیف پول سازگار با Web3 یافت نشد")
  }

  try {
    // Get the current network configuration based on selected network type
    const currentNetworkConfig = getZanjirNetwork()

    // First try to switch to the network
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: currentNetworkConfig.chainId }],
      })

      return true
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add the network to MetaMask
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [currentNetworkConfig],
          })

          // After adding, try to switch to it again
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: currentNetworkConfig.chainId }],
          })

          return true
        } catch (addError) {
          console.error("Error adding network:", addError)
          throw addError
        }
      }
      console.error("Error switching network:", switchError)
      throw switchError
    }
  } catch (error) {
    console.error("Error in switchToZanjirNetwork:", error)
    throw error
  }
}

// بررسی نسخه ethers و ایجاد provider مناسب
export function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask یا کیف پول سازگار با Web3 یافت نشد")
  }

  // ethers v6
  return new ethers.BrowserProvider(window.ethereum)
}

// تابع برای اتصال به کیف پول و اطمینان از استفاده از شبکه Zanjir
// Update the connectWallet function to force reconnection
export async function connectWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask یا کیف پول سازگار با Web3 یافت نشد")
  }

  try {
    // Force MetaMask to show the connection prompt by using eth_requestAccounts
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

    if (accounts.length === 0) {
      throw new Error("هیچ حسابی انتخاب نشد")
    }

    return accounts[0]
  } catch (error) {
    console.error("خطا در اتصال به کیف پول:", error)
    throw error
  }
}

// تابع برای قطع اتصال کیف پول
// Update the disconnectWallet function to properly reset connection
export async function disconnectWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    return true
  }

  try {
    // MetaMask doesn't provide a direct disconnect method,
    // but we can try to revoke permissions if the _metamask property exists
    if (window.ethereum._metamask) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        })
      } catch (e) {
        // Ignore errors from this experimental method
        console.log("Could not revoke permissions")
      }
    }

    return true
  } catch (error) {
    console.error("Error in disconnectWallet:", error)
    return false
  }
}

// تابع برای بررسی وضعیت اتصال کیف پول
export async function checkWalletConnection() {
  if (typeof window === "undefined" || !window.ethereum) {
    return { connected: false, account: null }
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" })
    return {
      connected: accounts.length > 0,
      account: accounts.length > 0 ? accounts[0] : null,
    }
  } catch (error) {
    console.error("خطا در بررسی وضعیت اتصال کیف پول:", error)
    return { connected: false, account: null }
  }
}

// تابع برای اتصال به قرارداد مدیریت استخر
export async function connectToPoolManager() {
  try {
    // اطمینان از اتصال به شبکه Zanjir
    const isZanjirNetwork = await checkZanjirNetwork()
    if (!isZanjirNetwork) {
      await switchToZanjirNetwork()
    }

    await window.ethereum.request({ method: "eth_requestAccounts" })
    const provider = getProvider()

    // ethers v6
    const signer = await provider.getSigner()
    const poolManagerAddress = getPoolManagerAddress()
    const contract = new ethers.Contract(poolManagerAddress, POOL_MANAGER_ABI, signer)
    return { provider, signer, contract }
  } catch (error) {
    console.error("خطا در اتصال به قرارداد مدیریت استخر:", error)
    throw error
  }
}

// تابع برای مرتب‌سازی آدرس‌های توکن به صورت صعودی
export function sortTokenAddresses(tokenAAddress: string, tokenBAddress: string) {
  // تبدیل آدرس‌ها به حروف کوچک برای مقایسه یکسان
  const addressA = tokenAAddress.toLowerCase()
  const addressB = tokenBAddress.toLowerCase()

  // مرتب‌سازی آدرس‌ها به صورت صعودی
  if (addressA < addressB) {
    return { tokenA: tokenAAddress, tokenB: tokenBAddress, swapped: false }
  } else {
    return { tokenA: tokenBAddress, tokenB: tokenAAddress, swapped: true }
  }
}

// تابع برای بررسی وجود استخر
export async function checkPoolExists(tokenAAddress: string, tokenBAddress: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    const { contract } = await connectToPoolManager()
    const poolAddress = await contract.getPool(tokenA, tokenB)

    // اگر آدرس استخر آدرس صفر باشد، استخر وجود ندارد
    return poolAddress !== "0x0000000000000000000000000000000000000000"
  } catch (error) {
    console.error("خطا در بررسی وجود استخر:", error)
    return false
  }
}

// تابع برای ایجاد استخر جدید
export async function createPool(tokenAAddress: string, tokenBAddress: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    const { contract } = await connectToPoolManager()
    const tx = await contract.createPoolIfNotExists(tokenA, tokenB)
    await tx.wait()

    // بررسی مجدد وجود استخر
    const poolExists = await checkPoolExists(tokenA, tokenB)
    if (!poolExists) {
      throw new Error("ایجاد استخر با شکست مواجه شد")
    }
    return poolExists
  } catch (error) {
    console.error("خطا در ایجاد استخر:", error)
    throw error
  }
}

// تابع برای دریافت آدرس استخر
export async function getPoolAddress(tokenAAddress: string, tokenBAddress: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    const { contract } = await connectToPoolManager()
    const poolAddress = await contract.getPool(tokenA, tokenB)

    if (poolAddress === "0x0000000000000000000000000000000000000000") {
      return null
    }

    return poolAddress
  } catch (error) {
    console.error("خطا در دریافت آدرس استخر:", error)
    return null
  }
}

// تابع برای اتصال به استخر
export async function connectToPool(tokenAAddress: string, tokenBAddress: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    const { provider, signer, contract: poolManager } = await connectToPoolManager()
    const poolAddress = await poolManager.getPool(tokenA, tokenB)

    if (poolAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("استخر برای این جفت توکن وجود ندارد")
    }

    const poolContract = new ethers.Contract(poolAddress, BASIC_POOL_ABI, signer)
    return { provider, signer, contract: poolContract, address: poolAddress }
  } catch (error) {
    console.error("خطا در اتصال به استخر:", error)
    throw error
  }
}

// تابع برای اتصال به توکن ERC20
export async function connectToToken(tokenAddress: string) {
  try {
    const provider = getProvider()

    // ethers v6
    const signer = await provider.getSigner()

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
    return tokenContract
  } catch (error) {
    console.error("خطا در اتصال به توکن:", error)
    throw error
  }
}

// تابع برای دریافت موجودی توکن
export async function getTokenBalance(tokenAddress: string, userAddress: string) {
  try {
    const tokenContract = await connectToToken(tokenAddress)
    const balance = await tokenContract.balanceOf(userAddress)
    const decimals = await tokenContract.decimals()

    // ethers v6
    return ethers.formatUnits(balance, decimals)
  } catch (error) {
    console.error("خطا در دریافت موجودی توکن:", error)
    return "0"
  }
}

// Update the getPoolInfo function to handle the new getExchangeRate return format
export async function getPoolInfo(tokenAAddress: string, tokenBAddress: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB, swapped } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    const poolExists = await checkPoolExists(tokenA, tokenB)

    if (!poolExists) {
      return {
        exists: false,
        reservoirA: "0",
        reservoirB: "0",
        exchangeRate: "0",
      }
    }

    const { contract: pool } = await connectToPool(tokenA, tokenB)

    const reservoirA = await pool.reserveA()
    const reservoirB = await pool.reserveB()

    const tokenAContract = await connectToToken(tokenA)
    const tokenBContract = await connectToToken(tokenB)

    const decimalsA = await tokenAContract.decimals()
    const decimalsB = await tokenBContract.decimals()

    // ethers v6
    const reservoirAFormatted = ethers.formatUnits(reservoirA, decimalsA)
    const reservoirBFormatted = ethers.formatUnits(reservoirB, decimalsB)

    // دریافت نرخ تبادل با فرمت جدید (دو مقدار)
    const [rateAtoB, rateBtoA] = await pool.getExchangeRate()

    // محاسبه نرخ تبادل
    let exchangeRate = "0"
    exchangeRate = ethers.formatUnits(rateAtoB, 18)

    return {
      exists: true,
      reservoirA: reservoirAFormatted,
      reservoirB: reservoirBFormatted,
      exchangeRate,
      swapped,
    }
  } catch (error) {
    console.error("خطا در دریافت اطلاعات استخر:", error)
    return {
      exists: false,
      reservoirA: "0",
      reservoirB: "0",
      exchangeRate: "0",
      swapped: false,
    }
  }
}

// Remove the calculateOutputAmount function since we won't be using it anymore
// This function can be deleted:

// تابع برای محاسبه حداقل مقدار خروجی با در نظر گرفتن لغزش
export function calculateMinimumOutputWithSlippage(outputAmount: string, slippagePercentage: string): string {
  try {
    const outputAmountNum = Number.parseFloat(outputAmount)
    const slippageNum = Number.parseFloat(slippagePercentage) / 100

    if (isNaN(outputAmountNum) || isNaN(slippageNum)) {
      return "0"
    }

    // Calculate minimum output amount with slippage
    const minOutputNum = outputAmountNum * (1 - slippageNum)

    // Preserve the original decimal precision
    const decimalPlaces = (outputAmount.split(".")[1] || "").length
    return minOutputNum.toFixed(decimalPlaces)
  } catch (error) {
    console.error("خطا در محاسبه حداقل مقدار خروجی:", error)
    return "0"
  }
}

// تابع برای تایید توکن
export async function approveToken(tokenAddress: string, spenderAddress: string, amount: string) {
  try {
    if (!spenderAddress) {
      throw new Error("آدرس spender نامعتبر است")
    }

    const tokenContract = await connectToToken(tokenAddress)
    const decimals = await tokenContract.decimals()

    // ethers v6
    const amountInWei = ethers.parseUnits(amount, decimals)

    const tx = await tokenContract.approve(spenderAddress, amountInWei)
    await tx.wait()

    return true
  } catch (error) {
    console.error("خطا در تایید توکن:", error)
    throw error
  }
}

// تابع برای افزودن نقدینگی
export async function addLiquidity(tokenAAddress: string, tokenBAddress: string, amountA: string, amountB: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB, swapped } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    // مرتب‌سازی مقادیر متناسب با آدرس‌ها
    const firstAmount = swapped ? amountB : amountA
    const secondAmount = swapped ? amountA : amountB

    // بررسی وجود استخر
    let poolExists = await checkPoolExists(tokenA, tokenB)

    // اگر استخر وجود ندارد، آن را ایجاد کنید
    if (!poolExists) {
      await createPool(tokenA, tokenB)
      poolExists = await checkPoolExists(tokenA, tokenB)
      if (!poolExists) {
        throw new Error("ایجاد استخر با شکست مواجه شد")
      }
    }

    // دریافت آدرس استخر
    const poolAddress = await getPoolAddress(tokenA, tokenB)
    if (!poolAddress) {
      throw new Error("آدرس استخر نامعتبر است")
    }

    // اتصال به استخر
    const { contract: pool } = await connectToPool(tokenA, tokenB)

    // دریافت اطلاعات توکن‌ها
    const tokenAContract = await connectToToken(tokenA)
    const tokenBContract = await connectToToken(tokenB)

    const decimalsA = await tokenAContract.decimals()
    const decimalsB = await tokenBContract.decimals()

    // تبدیل مقادیر به واحد وی
    const amountAInWei = ethers.parseUnits(firstAmount, decimalsA)
    const amountBInWei = ethers.parseUnits(secondAmount, decimalsB)

    console.log("تایید توکن A برای استخر با آدرس:", poolAddress)
    // تایید توکن‌ها
    await approveToken(tokenA, poolAddress, firstAmount)

    console.log("تایید توکن B برای استخر با آدرس:", poolAddress)
    await approveToken(tokenB, poolAddress, secondAmount)

    // افزودن نقدینگی
    const tx = await pool.addLiquidity(amountAInWei, amountBInWei)
    await tx.wait()

    return true
  } catch (error) {
    console.error("خطا در افزودن نقدینگی:", error)
    throw error
  }
}

// Update the swapAForB function to accept a status callback
export async function swapAForB(
  tokenAAddress: string,
  tokenBAddress: string,
  amountIn: string,
  minAmountOut: string,
  onStatusUpdate?: (status: "approving" | "swapping" | "completed" | "error") => void,
) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB, swapped } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    // بررسی وجود استخر
    const poolExists = await checkPoolExists(tokenA, tokenB)

    if (!poolExists) {
      throw new Error("استخر برای این جفت توکن وجود ندارد")
    }

    // دریافت آدرس استخر
    const poolAddress = await getPoolAddress(tokenA, tokenB)
    if (!poolAddress) {
      throw new Error("آدرس استخر نامعتبر است")
    }

    // اتصال به استخر
    const { contract: pool } = await connectToPool(tokenA, tokenB)

    // دریافت اطلاعات توکن‌ها
    const tokenAContract = await connectToToken(tokenA)
    const decimalsA = await tokenAContract.decimals()
    const decimalsB = await (await connectToToken(tokenB)).decimals()

    // تبدیل مقادیر به واحد وی
    const amountInWei = ethers.parseUnits(amountIn, decimalsA)
    const minAmountOutWei = ethers.parseUnits(minAmountOut, decimalsB)

    // تایید توکن
    onStatusUpdate?.("approving")
    await approveToken(tokenA, poolAddress, amountIn)

    // مبادله
    onStatusUpdate?.("swapping")
    const tx = await pool.swapAForB(amountInWei, minAmountOutWei)
    await tx.wait()

    onStatusUpdate?.("completed")
    return true
  } catch (error) {
    onStatusUpdate?.("error")
    console.error("خطا در مبادله توکن A به B:", error)
    throw error
  }
}

// Update the swapBForA function to accept a status callback
export async function swapBForA(
  tokenAAddress: string,
  tokenBAddress: string,
  amountIn: string,
  minAmountOut: string,
  onStatusUpdate?: (status: "approving" | "swapping" | "completed" | "error") => void,
) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB, swapped } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    // بررسی وجود استخر
    const poolExists = await checkPoolExists(tokenA, tokenB)

    if (!poolExists) {
      throw new Error("استخر برای این جفت توکن وجود ندارد")
    }

    // دریافت آدرس استخر
    const poolAddress = await getPoolAddress(tokenA, tokenB)
    if (!poolAddress) {
      throw new Error("آدرس استخر نامعتبر است")
    }

    // اتصال به استخر
    const { contract: pool } = await connectToPool(tokenA, tokenB)

    // دریافت اطلاعات توکن‌ها
    const tokenBContract = await connectToToken(tokenB)
    const decimalsB = await tokenBContract.decimals()
    const decimalsA = await (await connectToToken(tokenA)).decimals()

    // تبدیل مقادیر به واحد وی
    const amountInWei = ethers.parseUnits(amountIn, decimalsB)
    const minAmountOutWei = ethers.parseUnits(minAmountOut, decimalsA)

    // تایید توکن
    onStatusUpdate?.("approving")
    await approveToken(tokenB, poolAddress, amountIn)

    // مبادله
    onStatusUpdate?.("swapping")
    const tx = await pool.swapBForA(amountInWei, minAmountOutWei)
    await tx.wait()

    onStatusUpdate?.("completed")
    return true
  } catch (error) {
    onStatusUpdate?.("error")
    console.error("خطا در مبادله توکن B به A:", error)
    throw error
  }
}

// تابع برای دریافت مقدار پاداش قابل برداشت
export async function getPendingRewards(tokenAAddress: string, tokenBAddress: string, userAddress: string) {
  // در قرارداد جدید، تابع pendingRewards وجود ندارد
  // برای حفظ سازگاری با کد فعلی، مقدار 0 برمی‌گردانیم
  return "0"
}

// Update the claimRewards function similarly
export async function claimRewards(tokenAAddress: string, tokenBAddress: string) {
  // در قرارداد جدید، تابع claimRewards وجود ندارد
  // برای حفظ سازگاری با کد فعلی، true برمی‌گردانیم
  return true
}

// تابع برای دریافت تعداد توکن‌های LP کاربر
export async function getUserLPTokens(tokenAAddress: string, tokenBAddress: string, userAddress: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    // بررسی وجود استخر
    const poolExists = await checkPoolExists(tokenA, tokenB)

    if (!poolExists) {
      return "0"
    }

    // اتصال به استخر
    const { contract: pool } = await connectToPool(tokenA, tokenB)

    // دریافت تعداد توکن‌های LP با استفاده از balanceOf
    const lpTokens = await pool.balanceOf(userAddress)

    // ethers v6
    return ethers.formatEther(lpTokens)
  } catch (error) {
    console.error("خطا در دریافت تعداد توکن‌های LP:", error)
    return "0"
  }
}

// Update the getSwapEvents function to include transaction hash
export async function getSwapEvents(tokenAAddress: string, tokenBAddress: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    // بررسی وجود استخر
    const poolExists = await checkPoolExists(tokenA, tokenB)

    if (!poolExists) {
      console.log("رویدادهای Swap: استخر برای این جفت توکن وجود ندارد")
      return []
    }

    // اتصال به استخر
    const { contract: pool, provider } = await connectToPool(tokenA, tokenB)

    // Check if the contract has the necessary event
    if (!pool || !pool.filters) {
      console.error("Contract or filters not available")
      return []
    }

    // ethers v6
    try {
      // Check if the contract interface has the Swap event
      const hasSwapEvent = pool.interface.fragments.some(
        (fragment) => fragment.type === "event" && fragment.name === "Swap",
      )

      if (!hasSwapEvent) {
        console.error("Swap event not found in contract interface")
        return []
      }

      const latestBlock = BigInt(100)
      const fromBlock = BigInt("987654321") // MAGIC!

      const filter = pool.filters.Swap()

      // Use getEvents instead of queryFilter with the event name
      const events = await pool.queryFilter(filter, fromBlock, latestBlock)

      // Add block timestamps to events
      const eventsWithTimestamps = await Promise.all(
        events.map(async (event) => {
          try {
            const block = await provider.getBlock(event.blockNumber)
            return {
              ...event,
              blockTimestamp: Number(block?.timestamp || 0),
              transactionHash: event.transactionHash, // Include transaction hash
              args: {
                user: event.args[0] || "",
                isAToB: event.args[1] !== undefined ? event.args[1] : true,
                amountIn: event.args[2] || BigInt(0),
                amountOut: event.args[3] || BigInt(0),
              },
            }
          } catch (error) {
            console.error("Error fetching block data:", error)
            return {
              ...event,
              blockTimestamp: Math.floor(Date.now() / 1000),
              transactionHash: event.transactionHash, // Include transaction hash
              args: {
                user: event.args?.[0] || "",
                isAToB: event.args?.[1] !== undefined ? event.args[1] : true,
                amountIn: event.args?.[2] || BigInt(0),
                amountOut: event.args?.[3] || BigInt(0),
              },
            }
          }
        }),
      )

      return eventsWithTimestamps
    } catch (error) {
      console.error("Error processing events:", error)
      return []
    }
  } catch (error) {
    console.error("خطا در دریافت رویدادهای Swap:", error)
    return []
  }
}

// Add a new function to get the preview of liquidity removal
export async function getRemoveLiquidityPreview(tokenAAddress: string, tokenBAddress: string, liquidity: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    // بررسی وجود استخر
    const poolExists = await checkPoolExists(tokenA, tokenB)

    if (!poolExists) {
      return { amountA: "0", amountB: "0" }
    }

    // اتصال به استخر
    const { contract: pool } = await connectToPool(tokenA, tokenB)

    // تبدیل مقدار liquidity به واحد وی
    const liquidityInWei = ethers.parseEther(liquidity)

    // دریافت مقادیر پیش‌بینی شده
    const [amountA, amountB] = await pool.calculateRemoveLiquidity(liquidityInWei)

    // دریافت اطلاعات توکن‌ها
    const tokenAContract = await connectToToken(tokenA)
    const tokenBContract = await connectToToken(tokenB)

    const decimalsA = await tokenAContract.decimals()
    const decimalsB = await tokenBContract.decimals()

    // تبدیل مقادیر به فرمت خوانا
    const amountAFormatted = ethers.formatUnits(amountA, decimalsA)
    const amountBFormatted = ethers.formatUnits(amountB, decimalsB)

    return { amountA: amountAFormatted, amountB: amountBFormatted }
  } catch (error) {
    console.error("خطا در دریافت پیش‌بینی برداشت نقدینگی:", error)
    return { amountA: "0", amountB: "0" }
  }
}

// &#x0422;&#x0430;&#x0431;&#x0435;&#x044C; &#x0434;&#x043B;&#x044F; &#x0431;&#x0435;&#x0440;&#x0435;&#x0437;&#x043D;&#x043E;&#x0433;&#x043E; &#x0432;&#x044B;&#x0432;&#x043E;&#x0434;&#x0430; &#x043D;&#x0430;&#x043A;&#x0434;&#x0438;&#x043D;&#x0433;&#x0438;
export async function removeLiquidity(tokenAAddress: string, tokenBAddress: string, liquidity: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    // بررسی وجود استخر
    const poolExists = await checkPoolExists(tokenA, tokenB)

    if (!poolExists) {
      throw new Error("استخر برای این جفت توکن وجود ندارد")
    }

    // دریافت آدرس استخر
    const poolAddress = await getPoolAddress(tokenA, tokenB)
    if (!poolAddress) {
      throw new Error("آدرس استخر نامعتبر است")
    }

    // اتصال به استخر
    const { contract: pool } = await connectToPool(tokenA, tokenB)

    // دریافت اطلاعات توکن‌ها
    const tokenAContract = await connectToToken(tokenA)
    const tokenBContract = await connectToToken(tokenB)

    const decimalsA = await tokenAContract.decimals()
    const decimalsB = await tokenBContract.decimals()

    // تبدیل مقدار liquidity به واحد وی
    const liquidityInWei = ethers.parseEther(liquidity)

    // برداشت نقدینگی
    const tx = await pool.removeLiquidity(liquidityInWei)
    await tx.wait()

    return true
  } catch (error) {
    console.error("خطا در برداشت نقدینگی:", error)
    throw error
  }
}

// Add this function to estimate LP tokens that will be issued
export async function estimateLPTokensToReceive(
  tokenAAddress: string,
  tokenBAddress: string,
  amountA: string,
  amountB: string,
) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    // بررسی وجود استخر
    const poolExists = await checkPoolExists(tokenA, tokenB)

    // اگر استخر وجود ندارد، تخمین اولیه LP توکن‌ها را برمی‌گردانیم
    if (!poolExists) {
      // در استخر جدید، LP توکن‌ها معمولاً برابر با مجذور حاصل‌ضرب مقادیر است
      const amountANum = Number.parseFloat(amountA)
      const amountBNum = Number.parseFloat(amountB)

      if (isNaN(amountANum) || isNaN(amountBNum) || amountANum <= 0 || amountBNum <= 0) {
        return "0"
      }

      // تخمین اولیه: مجذور حاصل‌ضرب مقادیر
      return Math.sqrt(amountANum * amountBNum).toString()
    }

    // دریافت آدرس استخر
    const poolAddress = await getPoolAddress(tokenA, tokenB)
    if (!poolAddress) {
      throw new Error("آدرس استخر نامعتبر است")
    }

    // اتصال به استخر
    const { contract: pool } = await connectToPool(tokenA, tokenB)

    // دریافت اطلاعات توکن‌ها
    const tokenAContract = await connectToToken(tokenA)
    const tokenBContract = await connectToToken(tokenB)

    const decimalsA = await tokenAContract.decimals()
    const decimalsB = await tokenBContract.decimals()

    // تبدیل مقادیر به واحد وی
    const amountAInWei = ethers.parseUnits(amountA, decimalsA)
    const amountBInWei = ethers.parseUnits(amountB, decimalsB)

    // دریافت ذخایر فعلی استخر
    const reservoirA = await pool.reserveA()
    const reservoirB = await pool.reserveB()
    const totalSupply = await pool.totalSupply()

    // محاسبه تعداد توکن‌های LP که صادر خواهد شد
    let lpTokensToReceive

    if (totalSupply.toString() === "0") {
      // اگر استخر خالی است (اولین افزودن نقدینگی)
      // LP توکن‌ها معمولاً برابر با مجذور حاصل‌ضرب مقادیر است
      lpTokensToReceive = ethers.parseEther(
        Math.sqrt(
          Number(ethers.formatUnits(amountAInWei, decimalsA)) * Number(ethers.formatUnits(amountBInWei, decimalsB)),
        ).toString(),
      )
    } else {
      // اگر استخر موجود است
      // LP توکن‌ها بر اساس نسبت مقادیر به ذخایر موجود محاسبه می‌شود
      // فرمول: min(amountA * totalSupply / reservoirA, amountB * totalSupply / reservoirB)

      if (reservoirA.toString() === "0" || reservoirB.toString() === "0") {
        return "0" // جلوگیری از تقسیم بر صفر
      }

      // ethers v6 - استفاده از عملگرهای BigInt
      // تبدیل به BigInt برای محاسبات دقیق
      const amountABigInt = BigInt(amountAInWei.toString())
      const amountBBigInt = BigInt(amountBInWei.toString())
      const totalSupplyBigInt = BigInt(totalSupply.toString())
      const reservoirABigInt = BigInt(reservoirA.toString())
      const reservoirBBigInt = BigInt(reservoirB.toString())

      // محاسبه با استفاده از عملگرهای BigInt
      const lpFromA = (amountABigInt * totalSupplyBigInt) / reservoirABigInt
      const lpFromB = (amountBBigInt * totalSupplyBigInt) / reservoirBBigInt

      // انتخاب مقدار کمتر
      lpTokensToReceive = lpFromA < lpFromB ? lpFromA : lpFromB
    }

    // تبدیل به فرمت خوانا
    return ethers.formatEther(lpTokensToReceive)
  } catch (error) {
    console.error("خطا در تخمین تعداد توکن‌های LP:", error)
    return "0"
  }
}

// Add this new function to get the exact output amount from the contract
export async function getExactOutputAmount(
  tokenAAddress: string,
  tokenBAddress: string,
  amountIn: string,
  isAToB: boolean,
) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB, swapped } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    // بررسی وجود استخر
    const poolExists = await checkPoolExists(tokenA, tokenB)

    if (!poolExists) {
      return "0"
    }

    // اتصال به استخر
    const { contract: pool } = await connectToPool(tokenA, tokenB)

    // دریافت اطلاعات توکن‌ها
    const tokenAContract = await connectToToken(tokenA)
    const tokenBContract = await connectToToken(tokenB)

    const decimalsA = await tokenAContract.decimals()
    const decimalsB = await tokenBContract.decimals()

    // تبدیل مقدار ورودی به واحد وی
    const amountInWei = ethers.parseUnits(amountIn, isAToB ? decimalsA : decimalsB)

    // استفاده از توابع تقریبی جدید برای محاسبه مقدار خروجی
    let outputAmount

    // تنظیم جهت مبادله با توجه به اینکه آیا توکن‌ها جابجا شده‌اند یا خیر
    const effectiveIsAToB = swapped ? !isAToB : isAToB

    if (effectiveIsAToB) {
      // محاسبه مقدار توکن B که کاربر دریافت خواهد کرد با استفاده از تابع approxAForB
      outputAmount = await pool.approxAForB(amountInWei)
    } else {
      // محاسبه مقدار توکن A که کاربر دریافت خواهد کرد با استفاده از تابع approxBForA
      outputAmount = await pool.approxBForA(amountInWei)
    }

    // تبدیل مقدار خروجی به فرمت خوانا با حفظ تعداد اعشار توکن
    const outputDecimals = isAToB ? decimalsB : decimalsA

    return ethers.formatUnits(outputAmount, outputDecimals)
  } catch (error) {
    console.error("خطا در محاسبه مقدار خروجی تقریبی:", error)
    return null
  }
}

// تابع برای بررسی اعتبار آدرس قرارداد ERC20
export async function isValidERC20(tokenAddress: string): Promise<boolean> {
  try {
    // اتصال به قرارداد
    const tokenContract = await connectToToken(tokenAddress)

    // بررسی وجود توابع استاندارد ERC20 - با مدیریت خطای هر تابع به صورت جداگانه
    try {
      await tokenContract.symbol()
    } catch (error) {
      console.error("Error calling symbol():", error)
      return false
    }

    try {
      await tokenContract.name()
    } catch (error) {
      console.error("Error calling name():", error)
      return false
    }

    try {
      await tokenContract.decimals()
    } catch (error) {
      console.error("Error calling decimals():", error)
      return false
    }

    // اگر همه توابع با موفقیت اجرا شوند، قرارداد یک ERC20 معتبر است
    return true
  } catch (error) {
    console.error("خطا در بررسی اعتبار توکن ERC20:", error)
    return false
  }
}

// تابع برای دریافت اطلاعات توکن ERC20
export async function getERC20Info(tokenAddress: string): Promise<{ symbol: string; name: string; decimals: number }> {
  try {
    // اتصال به قرارداد
    const tokenContract = await connectToToken(tokenAddress)

    // دریافت اطلاعات توکن
    const [symbol, name, decimals] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.name(),
      tokenContract.decimals(),
    ])

    return {
      symbol,
      name,
      decimals: Number(decimals),
    }
  } catch (error) {
    console.error("خطا در دریافت اطلاعات توکن ERC20:", error)
    throw new Error("خطا در دریافت اطلاعات توکن")
  }
}

// Add a new helper function to get token decimals
export async function getTokenDecimals(tokenAddress: string): Promise<number> {
  try {
    const tokenContract = await connectToToken(tokenAddress)
    const decimals = await tokenContract.decimals()
    return Number(decimals)
  } catch (error) {
    console.error("خطا در دریافت تعداد اعشار توکن:", error)
    return 18 // Default to 18 decimals as fallback
  }
}
