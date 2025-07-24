// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PharmaceuticalData
 * @dev Smart contract for storing pharmaceutical batch data on blockchain
 * @author Shield Drug Team
 */
contract PharmaceuticalData {
    // Events
    event BatchRecorded(
        string indexed uploadId,
        string drugName,
        string batchId,
        uint256 quantity,
        string manufacturer,
        string fileHash,
        uint256 expiryDate,
        uint256 timestamp
    );

    event QRCodeRecorded(
        string indexed qrCodeId,
        string uploadId,
        uint256 serialNumber,
        uint256 timestamp
    );

    event BatchVerified(
        string indexed uploadId,
        bool isValid,
        uint256 timestamp
    );

    // Structs
    struct Batch {
        string uploadId;
        string drugName;
        string batchId;
        uint256 quantity;
        string manufacturer;
        string fileHash;
        uint256 expiryDate;
        uint256 timestamp;
        bool isValid;
    }

    struct QRCode {
        string qrCodeId;
        string uploadId;
        uint256 serialNumber;
        uint256 timestamp;
        bool isScanned;
        string scannedBy;
        uint256 scannedAt;
    }

    // State variables
    mapping(string => Batch) public batches;
    mapping(string => QRCode) public qrCodes;
    mapping(string => bool) public uploadExists;
    mapping(string => bool) public qrCodeExists;

    // Access control
    address public owner;
    mapping(address => bool) public authorizedManufacturers;
    mapping(address => bool) public authorizedPharmacists;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorizedManufacturer() {
        require(
            authorizedManufacturers[msg.sender],
            "Only authorized manufacturers can call this function"
        );
        _;
    }

    modifier onlyAuthorizedPharmacist() {
        require(
            authorizedPharmacists[msg.sender],
            "Only authorized pharmacists can call this function"
        );
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Record pharmaceutical batch data
     * @param uploadId Unique identifier for the upload
     * @param drugName Name of the drug
     * @param batchId Batch identifier
     * @param quantity Total quantity in the batch
     * @param manufacturer Manufacturer name
     * @param fileHash Hash of the uploaded file
     * @param expiryDate Expiry date as timestamp
     */
    function recordPharmaceuticalBatch(
        string memory uploadId,
        string memory drugName,
        string memory batchId,
        uint256 quantity,
        string memory manufacturer,
        string memory fileHash,
        uint256 expiryDate
    ) public onlyAuthorizedManufacturer returns (bool) {
        require(bytes(uploadId).length > 0, "Upload ID cannot be empty");
        require(bytes(drugName).length > 0, "Drug name cannot be empty");
        require(bytes(batchId).length > 0, "Batch ID cannot be empty");
        require(quantity > 0, "Quantity must be greater than 0");
        require(bytes(manufacturer).length > 0, "Manufacturer cannot be empty");
        require(bytes(fileHash).length > 0, "File hash cannot be empty");
        require(
            expiryDate > block.timestamp,
            "Expiry date must be in the future"
        );
        require(!uploadExists[uploadId], "Upload ID already exists");

        Batch memory newBatch = Batch({
            uploadId: uploadId,
            drugName: drugName,
            batchId: batchId,
            quantity: quantity,
            manufacturer: manufacturer,
            fileHash: fileHash,
            expiryDate: expiryDate,
            timestamp: block.timestamp,
            isValid: true
        });

        batches[uploadId] = newBatch;
        uploadExists[uploadId] = true;

        emit BatchRecorded(
            uploadId,
            drugName,
            batchId,
            quantity,
            manufacturer,
            fileHash,
            expiryDate,
            block.timestamp
        );

        return true;
    }

    /**
     * @dev Record QR code for a batch
     * @param qrCodeId Unique QR code identifier
     * @param uploadId Associated upload ID
     * @param serialNumber Serial number of the QR code
     */
    function recordQRCode(
        string memory qrCodeId,
        string memory uploadId,
        uint256 serialNumber
    ) public onlyAuthorizedManufacturer returns (bool) {
        require(bytes(qrCodeId).length > 0, "QR Code ID cannot be empty");
        require(uploadExists[uploadId], "Upload ID does not exist");
        require(!qrCodeExists[qrCodeId], "QR Code ID already exists");
        require(serialNumber > 0, "Serial number must be greater than 0");

        QRCode memory newQRCode = QRCode({
            qrCodeId: qrCodeId,
            uploadId: uploadId,
            serialNumber: serialNumber,
            timestamp: block.timestamp,
            isScanned: false,
            scannedBy: "",
            scannedAt: 0
        });

        qrCodes[qrCodeId] = newQRCode;
        qrCodeExists[qrCodeId] = true;

        emit QRCodeRecorded(qrCodeId, uploadId, serialNumber, block.timestamp);

        return true;
    }

    /**
     * @dev Mark QR code as scanned
     * @param qrCodeId QR code identifier
     * @param scannedBy Identifier of who scanned the QR code
     */
    function markQRCodeAsScanned(
        string memory qrCodeId,
        string memory scannedBy
    ) public onlyAuthorizedPharmacist returns (bool) {
        require(qrCodeExists[qrCodeId], "QR Code does not exist");
        require(!qrCodes[qrCodeId].isScanned, "QR Code already scanned");
        require(
            bytes(scannedBy).length > 0,
            "Scanner identifier cannot be empty"
        );

        qrCodes[qrCodeId].isScanned = true;
        qrCodes[qrCodeId].scannedBy = scannedBy;
        qrCodes[qrCodeId].scannedAt = block.timestamp;

        return true;
    }

    /**
     * @dev Verify batch validity
     * @param uploadId Upload identifier
     * @param isValid Whether the batch is valid
     */
    function verifyBatch(
        string memory uploadId,
        bool isValid
    ) public onlyAuthorizedPharmacist returns (bool) {
        require(uploadExists[uploadId], "Upload ID does not exist");

        batches[uploadId].isValid = isValid;

        emit BatchVerified(uploadId, isValid, block.timestamp);

        return true;
    }

    /**
     * @dev Get pharmaceutical batch data
     * @param uploadId Upload identifier
     * @return Batch data
     */
    function getPharmaceuticalBatch(
        string memory uploadId
    ) public view returns (Batch memory) {
        require(uploadExists[uploadId], "Upload ID does not exist");
        return batches[uploadId];
    }

    /**
     * @dev Get QR code data
     * @param qrCodeId QR code identifier
     * @return QR code data
     */
    function getQRCode(
        string memory qrCodeId
    ) public view returns (QRCode memory) {
        require(qrCodeExists[qrCodeId], "QR Code does not exist");
        return qrCodes[qrCodeId];
    }

    /**
     * @dev Check if upload exists
     * @param uploadId Upload identifier
     * @return True if upload exists
     */
    function uploadExistsCheck(
        string memory uploadId
    ) public view returns (bool) {
        return uploadExists[uploadId];
    }

    /**
     * @dev Check if QR code exists
     * @param qrCodeId QR code identifier
     * @return True if QR code exists
     */
    function qrCodeExistsCheck(
        string memory qrCodeId
    ) public view returns (bool) {
        return qrCodeExists[qrCodeId];
    }

    /**
     * @dev Add authorized manufacturer
     * @param manufacturer Address of the manufacturer
     */
    function addAuthorizedManufacturer(address manufacturer) public onlyOwner {
        require(manufacturer != address(0), "Invalid manufacturer address");
        authorizedManufacturers[manufacturer] = true;
    }

    /**
     * @dev Remove authorized manufacturer
     * @param manufacturer Address of the manufacturer
     */
    function removeAuthorizedManufacturer(
        address manufacturer
    ) public onlyOwner {
        authorizedManufacturers[manufacturer] = false;
    }

    /**
     * @dev Add authorized pharmacist
     * @param pharmacist Address of the pharmacist
     */
    function addAuthorizedPharmacist(address pharmacist) public onlyOwner {
        require(pharmacist != address(0), "Invalid pharmacist address");
        authorizedPharmacists[pharmacist] = true;
    }

    /**
     * @dev Remove authorized pharmacist
     * @param pharmacist Address of the pharmacist
     */
    function removeAuthorizedPharmacist(address pharmacist) public onlyOwner {
        authorizedPharmacists[pharmacist] = false;
    }

    /**
     * @dev Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        owner = newOwner;
    }

    /**
     * @dev Check if batch is expired
     * @param uploadId Upload identifier
     * @return True if batch is expired
     */
    function isBatchExpired(string memory uploadId) public view returns (bool) {
        require(uploadExists[uploadId], "Upload ID does not exist");
        return block.timestamp > batches[uploadId].expiryDate;
    }

    /**
     * @dev Get batch expiry status
     * @param uploadId Upload identifier
     * @return Days until expiry (negative if expired)
     */
    function getDaysUntilExpiry(
        string memory uploadId
    ) public view returns (int256) {
        require(uploadExists[uploadId], "Upload ID does not exist");
        uint256 expiryDate = batches[uploadId].expiryDate;
        uint256 currentTime = block.timestamp;

        if (currentTime >= expiryDate) {
            return -int256((currentTime - expiryDate) / 1 days);
        } else {
            return int256((expiryDate - currentTime) / 1 days);
        }
    }
}
