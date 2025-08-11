const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying PharmaceuticalData contract to Avalanche Fuji...");

  // Get the contract factory
  const PharmaceuticalData = await ethers.getContractFactory("PharmaceuticalData");
  
  console.log("📋 Contract factory created");

  // Deploy the contract
  console.log("🔗 Deploying contract...");
  const pharmaceuticalData = await PharmaceuticalData.deploy();
  
  console.log("⏳ Waiting for deployment confirmation...");
  await pharmaceuticalData.waitForDeployment();

  const address = await pharmaceuticalData.getAddress();
  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract Address:", address);
  console.log("🌐 View on Fuji Snowtrace:", `https://testnet.snowtrace.io/address/${address}`);

  // Verify the contract (optional for Avalanche)
  console.log("🔍 Verifying contract...");
  try {
    await pharmaceuticalData.deploymentTransaction()?.wait(5); // Wait for 5 confirmations
    
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    
    console.log("✅ Contract verified on Polygonscan!");
  } catch (error) {
    console.log("⚠️ Contract verification failed (this is normal for Amoy):", error);
  }

  // Save deployment info
  const deploymentInfo = {
    network: "Avalanche Fuji Testnet",
    contractAddress: address,
    deployer: await pharmaceuticalData.runner?.getAddress(),
    deploymentTime: new Date().toISOString(),
    chainId: 43113,
    explorerUrl: `https://testnet.snowtrace.io/address/${address}`,
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Update environment file
  console.log("\n🔧 Updating environment configuration...");
  console.log("Please update your .env.local file with:");
  console.log(`AVALANCHE_CONTRACT_ADDRESS=${address}`);

  return deploymentInfo;
}

main()
  .then((deploymentInfo) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("Your pharmaceutical blockchain is ready for real transactions!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });