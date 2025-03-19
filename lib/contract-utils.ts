import { ethers } from "ethers"

// اطلاعات شبکه Zanjir
export const ZANJIR_NETWORK = {
  chainId: "0x2f145", // 192837 in hex
  chainName: "Zanjir Network",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.zanjir.xyz"],
  blockExplorerUrls: ["https://zanjir.xyz/explorer"],
}

// ABI برای قرارداد مدیریت استخر
export const POOL_MANAGER_ABI = [
  "function getPool(address _tokenA, address _tokenB) public view returns (address)",
  "function createPoolIfNotExists(address _tokenA, address _tokenB) external returns (address)",
]

// ABI برای قرارداد BasicPool
export const BASIC_POOL_ABI = [
  "function setTokenA(address _tokenA) external",
  "function setTokenB(address _tokenB) external",
  "function addLiquidity(uint256 amountA, uint256 amountB) external",
  "function swapAForB(uint256 amountAIn, uint256 minAmountBOut) external",
  "function swapBForA(uint256 amountBIn, uint256 minAmountAOut) external",
  "function removeLiquidity() external",
  "function claimRewards() external",
  "function reservoirA() view returns (uint256)",
  "function reservoirB() view returns (uint256)",
  "function tokenA() view returns (address)",
  "function tokenB() view returns (address)",
  "function liquidityProvided(address) view returns (uint256)",
  "function pendingRewards(address) view returns (uint256)",
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
]

// آدرس قرارداد مدیریت استخر
export const POOL_MANAGER_ADDRESS = "0xFcCeD5E997E7fb1D0594518D3eD57245bB8ed17E"

// آدرس‌های توکن‌های مشخص شده
export const TOKEN_ADDRESSES = {
  SOL: "0x36E6dc3CF44FDb8C62c5a11B457A28041f4C6eEF",
  ETH: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
  USDT: "0x9ac37093d6eF6cb5fC0944DCed3AA56eBCE050cb",
  IRT: "0x09E5DCF3872DD653c4CCA5378AbA77088457A8a9",
  DOGE: "0xC7d2B19934594c43b6ec678507Df24D49e7e2F69",
  BTC: "0x3B05FB2fA2AE1447f61A0456f102350626A69f0b",
}

// بررسی اتصال به شبکه Zanjir
export async function checkZanjirNetwork() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask یا کیف پول سازگار با Web3 یافت نشد")
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" })
    return chainId === ZANJIR_NETWORK.chainId
  } catch (error) {
    console.error("خطا در بررسی شبکه:", error)
    return false
  }
}

// افزودن شبکه Zanjir به MetaMask
export async function addZanjirNetwork() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask یا کیف پول سازگار با Web3 یافت نشد")
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [ZANJIR_NETWORK],
    })
    return true
  } catch (error) {
    console.error("خطا در افزودن شبکه Zanjir:", error)
    throw error
  }
}

// تغییر شبکه به Zanjir
export async function switchToZanjirNetwork() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask یا کیف پول سازگار با Web3 یافت نشد")
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ZANJIR_NETWORK.chainId }],
    })
    return true
  } catch (error) {
    // اگر شبکه وجود نداشته باشد، آن را اضافه کنید
    if (error.code === 4902) {
      return await addZanjirNetwork()
    }
    console.error("خطا در تغییر به شبکه Zanjir:", error)
    throw error
  }
}

// بررسی نسخه ethers و ایجاد provider مناسب
export function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask یا کیف پول سازگار با Web3 یافت نشد")
  }

  // تشخیص نسخه ethers
  if (typeof ethers.providers !== "undefined") {
    // ethers v5
    return new ethers.providers.Web3Provider(window.ethereum)
  } else {
    // ethers v6
    return new ethers.BrowserProvider(window.ethereum)
  }
}

// تابع برای اتصال به کیف پول و اطمینان از استفاده از شبکه Zanjir
export async function connectWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask یا کیف پول سازگار با Web3 یافت نشد")
  }

  try {
    // بررسی اتصال به شبکه Zanjir
    const isZanjirNetwork = await checkZanjirNetwork()

    if (!isZanjirNetwork) {
      // تلاش برای تغییر به شبکه Zanjir
      await switchToZanjirNetwork()
    }

    // درخواست اتصال به حساب‌ها
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
export async function disconnectWallet() {
  // متاسفانه MetaMask API به طور مستقیم امکان قطع اتصال را فراهم نمی‌کند
  // اما می‌توانیم وضعیت اتصال را در برنامه خود مدیریت کنیم
  return true
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

    // تشخیص نسخه ethers
    let signer
    if (typeof ethers.providers !== "undefined") {
      // ethers v5
      signer = provider.getSigner()
    } else {
      // ethers v6
      signer = await provider.getSigner()
    }

    const contract = new ethers.Contract(POOL_MANAGER_ADDRESS, POOL_MANAGER_ABI, signer)
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

    // تشخیص نسخه ethers
    let signer
    if (typeof ethers.providers !== "undefined") {
      // ethers v5
      signer = provider.getSigner()
    } else {
      // ethers v6
      signer = await provider.getSigner()
    }

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

    // تشخیص نسخه ethers
    if (typeof ethers.utils !== "undefined") {
      // ethers v5
      return ethers.utils.formatUnits(balance, decimals)
    } else {
      // ethers v6
      return ethers.formatUnits(balance, decimals)
    }
  } catch (error) {
    console.error("خطا در دریافت موجودی توکن:", error)
    return "0"
  }
}

// تابع برای دریافت اطلاعات استخر
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

    const reservoirA = await pool.reservoirA()
    const reservoirB = await pool.reservoirB()

    const tokenAContract = await connectToToken(tokenA)
    const tokenBContract = await connectToToken(tokenB)

    const decimalsA = await tokenAContract.decimals()
    const decimalsB = await tokenBContract.decimals()

    // تشخیص نسخه ethers
    let reservoirAFormatted, reservoirBFormatted
    if (typeof ethers.utils !== "undefined") {
      // ethers v5
      reservoirAFormatted = ethers.utils.formatUnits(reservoirA, decimalsA)
      reservoirBFormatted = ethers.utils.formatUnits(reservoirB, decimalsB)
    } else {
      // ethers v6
      reservoirAFormatted = ethers.formatUnits(reservoirA, decimalsA)
      reservoirBFormatted = ethers.formatUnits(reservoirB, decimalsB)
    }

    // محاسبه نرخ تبادل
    let exchangeRate = "0"
    if (Number.parseFloat(reservoirAFormatted) > 0) {
      exchangeRate = (Number.parseFloat(reservoirBFormatted) / Number.parseFloat(reservoirAFormatted)).toString()
    }

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

// تابع برای محاسبه مقدار خروجی بر اساس فرمول CPMM
export function calculateOutputAmount(amountIn: string, reservoirIn: string, reservoirOut: string): string {
  try {
    // تبدیل مقادیر به اعداد
    const amountInNum = Number.parseFloat(amountIn)
    const reservoirInNum = Number.parseFloat(reservoirIn)
    const reservoirOutNum = Number.parseFloat(reservoirOut)

    if (
      isNaN(amountInNum) ||
      isNaN(reservoirInNum) ||
      isNaN(reservoirOutNum) ||
      amountInNum <= 0 ||
      reservoirInNum <= 0 ||
      reservoirOutNum <= 0
    ) {
      return "0"
    }

    // فرمول CPMM: amountOut = (reservoirOut * amountIn) / (reservoirIn + amountIn)
    const amountOutNum = (reservoirOutNum * amountInNum) / (reservoirInNum + amountInNum)

    return amountOutNum.toString()
  } catch (error) {
    console.error("خطا در محاسبه مقدار خروجی:", error)
    return "0"
  }
}

// تابع برای محاسبه حداقل مقدار خروجی با در نظر گرفتن لغزش
export function calculateMinimumOutputWithSlippage(outputAmount: string, slippagePercentage: string): string {
  try {
    const outputAmountNum = Number.parseFloat(outputAmount)
    const slippageNum = Number.parseFloat(slippagePercentage) / 100

    if (isNaN(outputAmountNum) || isNaN(slippageNum)) {
      return "0"
    }

    // حداقل مقدار خروجی = مقدار خروجی * (1 - لغزش)
    const minOutputNum = outputAmountNum * (1 - slippageNum)

    return minOutputNum.toString()
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

    // تشخیص نسخه ethers
    let amountInWei
    if (typeof ethers.utils !== "undefined") {
      // ethers v5
      amountInWei = ethers.utils.parseUnits(amount, decimals)
    } else {
      // ethers v6
      amountInWei = ethers.parseUnits(amount, decimals)
    }

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
    let amountAInWei, amountBInWei
    if (typeof ethers.utils !== "undefined") {
      // ethers v5
      amountAInWei = ethers.utils.parseUnits(firstAmount, decimalsA)
      amountBInWei = ethers.utils.parseUnits(secondAmount, decimalsB)
    } else {
      // ethers v6
      amountAInWei = ethers.parseUnits(firstAmount, decimalsA)
      amountBInWei = ethers.parseUnits(secondAmount, decimalsB)
    }

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

// تابع برای مبادله توکن A به B
export async function swapAForB(tokenAAddress: string, tokenBAddress: string, amountIn: string, minAmountOut: string) {
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
    let amountInWei, minAmountOutWei
    if (typeof ethers.utils !== "undefined") {
      // ethers v5
      amountInWei = ethers.utils.parseUnits(amountIn, decimalsA)
      minAmountOutWei = ethers.utils.parseUnits(minAmountOut, decimalsB)
    } else {
      // ethers v6
      amountInWei = ethers.parseUnits(amountIn, decimalsA)
      minAmountOutWei = ethers.parseUnits(minAmountOut, decimalsB)
    }

    // تایید توکن
    await approveToken(tokenA, poolAddress, amountIn)

    // مبادله
    const tx = await pool.swapAForB(amountInWei, minAmountOutWei)
    await tx.wait()

    return true
  } catch (error) {
    console.error("خطا در مبادله توکن A به B:", error)
    throw error
  }
}

// تابع برای مبادله توکن B به A
export async function swapBForA(tokenAAddress: string, tokenBAddress: string, amountIn: string, minAmountOut: string) {
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
    let amountInWei, minAmountOutWei
    if (typeof ethers.utils !== "undefined") {
      // ethers v5
      amountInWei = ethers.utils.parseUnits(amountIn, decimalsB)
      minAmountOutWei = ethers.utils.parseUnits(minAmountOut, decimalsA)
    } else {
      // ethers v6
      amountInWei = ethers.parseUnits(amountIn, decimalsB)
      minAmountOutWei = ethers.parseUnits(minAmountOut, decimalsA)
    }

    // تایید توکن
    await approveToken(tokenB, poolAddress, amountIn)

    // مبادله
    const tx = await pool.swapBForA(amountInWei, minAmountOutWei)
    await tx.wait()

    return true
  } catch (error) {
    console.error("خطا در مبادله توکن B به A:", error)
    throw error
  }
}

// تابع برای دریافت مقدار پاداش قابل برداشت
export async function getPendingRewards(tokenAAddress: string, tokenBAddress: string, userAddress: string) {
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

    // دریافت مقدار پاداش
    const pendingRewards = await pool.pendingRewards(userAddress)

    // تشخیص نسخه ethers
    if (typeof ethers.utils !== "undefined") {
      // ethers v5
      return ethers.utils.formatEther(pendingRewards)
    } else {
      // ethers v6
      return ethers.formatEther(pendingRewards)
    }
  } catch (error) {
    console.error("خطا در دریافت پاداش‌های قابل برداشت:", error)
    return "0"
  }
}

// تابع برای برداشت پاداش
export async function claimRewards(tokenAAddress: string, tokenBAddress: string) {
  try {
    // مرتب‌سازی آدرس‌ها
    const { tokenA, tokenB } = sortTokenAddresses(tokenAAddress, tokenBAddress)

    // بررسی وجود استخر
    const poolExists = await checkPoolExists(tokenA, tokenB)

    if (!poolExists) {
      throw new Error("استخر برای این جفت توکن وجود ندارد")
    }

    // اتصال به استخر
    const { contract: pool } = await connectToPool(tokenA, tokenB)

    // برداشت پاداش
    const tx = await pool.claimRewards()
    await tx.wait()

    return true
  } catch (error) {
    console.error("خطا در برداشت پاداش:", error)
    throw error
  }
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

    // دریافت تعداد توکن‌های LP
    const lpTokens = await pool.liquidityProvided(userAddress)

    // تشخیص نسخه ethers
    if (typeof ethers.utils !== "undefined") {
      // ethers v5
      return ethers.utils.formatEther(lpTokens)
    } else {
      // ethers v6
      return ethers.formatEther(lpTokens)
    }
  } catch (error) {
    console.error("خطا در دریافت تعداد توکن‌های LP:", error)
    return "0"
  }
}

