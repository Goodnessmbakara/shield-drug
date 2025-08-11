const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking contract status...");

  // Get the contract factory
  const PharmaceuticalData = await ethers.getContractFactory("PharmaceuticalData");
  
  // Connect to the deployed contract
  const contractAddress = "0x21d63c5178A7e2387285b26873fbac8ee0d99AaB";
  const contract = PharmaceuticalData.attach(contractAddress);

  // Get the signer (your wallet)
  const [signer] = await ethers.getSigners();
  console.log("👤 Your address:", signer.address);

  try {
    // Check contract owner
    const owner = await contract.owner();
    console.log("👑 Contract owner:", owner);
    console.log("🔐 Are you the owner?", owner.toLowerCase() === signer.address.toLowerCase());

    // Check manufacturer authorization
    const isAuthorized = await contract.authorizedManufacturers(signer.address);
    console.log("🏭 Are you authorized as manufacturer?", isAuthorized);

    // Check if there are any recorded batches
    console.log("\n📋 Checking for recorded batches...");
    
    // Try to get the test batch we just created
    const testUploadId = "TEST_1754043848041"; // From the previous run
    try {
      const testBatch = await contract.getPharmaceuticalBatch(testUploadId);
      console.log("✅ Found test batch:", {
        uploadId: testBatch.uploadId,
        drugName: testBatch.drugName,
        batchId: testBatch.batchId,
        quantity: testBatch.quantity.toString(),
        manufacturer: testBatch.manufacturer,
        expiryDate: new Date(Number(testBatch.expiryDate) * 1000).toISOString(),
        timestamp: new Date(Number(testBatch.timestamp) * 1000).toISOString(),
        isValid: testBatch.isValid
      });
    } catch (error) {
      console.log("❌ Test batch not found or error:", error.message);
    }

    console.log("\n🎉 Summary:");
    if (owner.toLowerCase() === signer.address.toLowerCase()) {
      console.log("✅ You are the contract owner");
    }
    if (isAuthorized) {
      console.log("✅ You are authorized as a manufacturer");
      console.log("🎯 You can now upload pharmaceutical batches through the web app!");
    } else {
      console.log("❌ You are NOT authorized as a manufacturer");
      console.log("💡 Run: npx hardhat run scripts/interact-with-contract.js --network amoy");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 