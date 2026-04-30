const mongoose = require("mongoose");
const Message = require("./models/Message");

const MONGODB_URI = "mongodb://localhost:27017/inquirydb";

mongoose.connect(MONGODB_URI);

const db = mongoose.connection;

db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

db.once("open", async () => {
  try {
    console.log("🗑️  Clearing messages collection...");
    await Message.deleteMany({});
    console.log("✅ Messages cleared.");

    console.log("📝 Seeding example messages...");

    // Example inquiry IDs and user IDs
    const exampleInquiryId1 = "inquiry66d5f1a1b2c3d4e5f6g7h8i9";
    const exampleInquiryId2 = "inquiry76d5f1a1b2c3d4e5f6g7h8i9";

    const buyerId1 = "69ce5fd795a5df410cd3a5ad";
    const sellerId1 = "69ce45d4d3f77baa18973716";

    const buyerId2 = "69ce5fd795a5df410cd3a5ae";
    const sellerId2 = "69ce45d4d3f77baa18973717";

    // Sample messages for first inquiry
    const exampleMessages = [
      {
        inquiry_id: exampleInquiryId1,
        sender_id: buyerId1,
        sender_name: "John Buyer",
        buyer_id: buyerId1,
        seller_id: sellerId1,
        message_body:
          "Hi! I'm interested in this vehicle. Can you provide more details about the condition?",
        reply_to: null,
      },
      {
        inquiry_id: exampleInquiryId1,
        sender_id: sellerId1,
        sender_name: "Ahmed Seller",
        buyer_id: buyerId1,
        seller_id: sellerId1,
        message_body:
          "Yes, the vehicle is in excellent condition. It has been well maintained and recently serviced.",
        reply_to: null,
      },
      {
        inquiry_id: exampleInquiryId1,
        sender_id: buyerId1,
        sender_name: "John Buyer",
        buyer_id: buyerId1,
        seller_id: sellerId1,
        message_body:
          "Great! What's the current mileage and are there any warranty options available?",
        reply_to: null,
      },
      {
        inquiry_id: exampleInquiryId1,
        sender_id: sellerId1,
        sender_name: "Ahmed Seller",
        buyer_id: buyerId1,
        seller_id: sellerId1,
        message_body:
          "The mileage is 45,000 km. We offer a 1-year warranty on all major components.",
        reply_to: null,
      },
      // Sample messages for second inquiry
      {
        inquiry_id: exampleInquiryId2,
        sender_id: buyerId2,
        sender_name: "Sarah Johnson",
        buyer_id: buyerId2,
        seller_id: sellerId2,
        message_body: "Hello! I noticed this listing. Is it still available?",
        reply_to: null,
      },
      {
        inquiry_id: exampleInquiryId2,
        sender_id: sellerId2,
        sender_name: "Ali Merchant",
        buyer_id: buyerId2,
        seller_id: sellerId2,
        message_body:
          "Yes, it's still available. Would you like to schedule a viewing?",
        reply_to: null,
      },
      {
        inquiry_id: exampleInquiryId2,
        sender_id: buyerId2,
        sender_name: "Sarah Johnson",
        buyer_id: buyerId2,
        seller_id: sellerId2,
        message_body: "Perfect! Can I visit this weekend?",
        reply_to: null,
      },
      {
        inquiry_id: exampleInquiryId2,
        sender_id: sellerId2,
        sender_name: "Ali Merchant",
        buyer_id: buyerId2,
        seller_id: sellerId2,
        message_body:
          "Sure! We're free on Saturday and Sunday. What time works best for you?",
        reply_to: null,
      },
    ];

    const insertedMessages = await Message.insertMany(exampleMessages);
    console.log(`✅ Added ${insertedMessages.length} example messages.`);

    console.log("\n📊 Example Messages Added:");
    console.log("Inquiry 1: 4 messages");
    console.log("Inquiry 2: 4 messages");
    console.log("\nNote: Use these IDs in your inquiries to see the messages:");
    console.log(`Inquiry 1 ID: ${exampleInquiryId1}`);
    console.log(`Inquiry 2 ID: ${exampleInquiryId2}`);

    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
});
