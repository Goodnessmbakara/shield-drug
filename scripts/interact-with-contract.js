const { ethers } = require("hardhat");

async function main() {
  console.log("🔗 Connecting to deployed contract...");

  // Get the contract factory
  const PharmaceuticalData = await ethers.getContractFactory("PharmaceuticalData");
  
  // Connect to the deployed contract
  const contractAddress = "0x21d63c5178A7e2387285b26873fbac8ee0d99AaB";
  const contract = PharmaceuticalData.attach(contractAddress);

  // Get the signer (your wallet)
  const [signer] = await ethers.getSigners();
  console.log("👤 Connected with address:", signer.address);

  try {
    // Check if you're the contract owner
    console.log("\n👑 Checking contract ownership...");
    const owner = await contract.owner();
    console.log("Contract owner:", owner);
    console.log("Your address:", signer.address);
    console.log("Are you the owner?", owner.toLowerCase() === signer.address.toLowerCase());

    // Check if you're authorized as a manufacturer
    console.log("\n🔍 Checking manufacturer authorization...");
    const isAuthorized = await contract.authorizedManufacturers(signer.address);
    console.log("Are you authorized as manufacturer?", isAuthorized);

    if (owner.toLowerCase() === signer.address.toLowerCase() && !isAuthorized) {
      console.log("\n🔐 Authorizing yourself as manufacturer...");
      
      // Add yourself as authorized manufacturer
      const tx = await contract.addAuthorizedManufacturer(signer.address);
      console.log("Transaction hash:", tx.hash);
      
      console.log("⏳ Waiting for confirmation...");
      await tx.wait();
      console.log("✅ Transaction confirmed!");
      
      // Verify authorization
      const isNowAuthorized = await contract.authorizedManufacturers(signer.address);
      console.log("Are you now authorized?", isNowAuthorized);
    }

    // Test recording a batch
    console.log("\n🧪 Testing batch recording...");
    const testUploadId = "TEST_" + Date.now();
    const testData = {
      uploadId: testUploadId,
      drugName: "Test Drug",
      batchId: "TEST001",
      quantity: 1000,
      manufacturer: "Test Manufacturer",
      fileHash: "0x" + "0".repeat(64),
      expiryDate: Math.floor(Date.now() / 1000) + 86400 * 365 // 1 year from now
    };

    console.log("Recording test batch:", testData);
    const recordTx = await contract.recordPharmaceuticalBatch(
      testData.uploadId,
      testData.drugName,
      testData.batchId,
      testData.quantity,
      testData.manufacturer,
      testData.fileHash,
      testData.expiryDate
    );
    
    console.log("Record transaction hash:", recordTx.hash);
    await recordTx.wait();
    console.log("✅ Test batch recorded successfully!");

    // Retrieve the recorded batch
    console.log("\n📋 Retrieving recorded batch...");
    const recordedBatch = await contract.getPharmaceuticalBatch(testData.uploadId);
    console.log("Recorded batch:", {
      uploadId: recordedBatch.uploadId,
      drugName: recordedBatch.drugName,
      batchId: recordedBatch.batchId,
      quantity: recordedBatch.quantity.toString(),
      manufacturer: recordedBatch.manufacturer,
      fileHash: recordedBatch.fileHash,
      expiryDate: new Date(Number(recordedBatch.expiryDate) * 1000).toISOString(),
      timestamp: new Date(Number(recordedBatch.timestamp) * 1000).toISOString(),
      isValid: recordedBatch.isValid
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("Only authorized manufacturers")) {
      console.log("💡 You need to authorize yourself as a manufacturer first");
    } else if (error.message.includes("Only owner")) {
      console.log("💡 Only the contract owner can call this function");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 