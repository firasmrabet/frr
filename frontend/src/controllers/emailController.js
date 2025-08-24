import crypto from "crypto";
import ejs from "ejs";
import path from "path";
import transporter from "../config/mailer.js";
import { encrypt, decrypt } from "../utils/encryptDecrypt.js";

const hashForType1 = crypto.createHash("sha256").update("1").digest("hex");
const hashForType2 = crypto.createHash("sha256").update("2").digest("hex");

export const validateType = (type) => {
  const hashedType = crypto.createHash("sha256").update(`${type}`).digest("hex");
  if (hashedType !== hashForType1 && hashedType !== hashForType2) {
    return false;
  }
  return hashedType;
};

export const prepareEmailDetails = (hashedType, name, message) => {
  const encryptedMessage = encrypt(message);
  const encryptedName = encrypt(name);

  const decryptedMessage = decrypt(encryptedMessage);
  const decryptedName = decrypt(encryptedName);

  let receipt = "";
  let subject = "";

  if (hashedType === hashForType1) {
  receipt = "firassmrabett111@gmail.com,marwenyoussef2017@gmail.com";
    subject = "Subject for Type 1";
  } else if (hashedType === hashForType2) {
  receipt = "firassmrabett111@gmail.com,marwenyoussef2017@gmail.com";
    subject = "Subject for Type 2";
  }

  return { receipt, subject, decryptedMessage, decryptedName };
};

export const generateHtmlContent = async (
  decryptedName,
  decryptedMessage,
  sender
) => {
  const templatePath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'Templates', 'emailTemplate.ejs');
  return ejs.renderFile(templatePath, {
    name: decryptedName,
    message: decryptedMessage,
    sender,
  });
};

export const sendEmail = async (sender, receipt, subject, html) => {
  try {
    await transporter.sendMail({
      from: sender,
      to: receipt,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const handleEmailRequest = async (req, res) => {
  const { type, sender, name, message } = req.body;

  // Validation des champs requis
  if (!type || !sender || !name || !message) {
    return res.status(400).json({ error: "All fields (type, sender, name, message) are required." });
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sender)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const hashedType = validateType(type);
  if (!hashedType) {
    return res.status(400).json({ error: "Invalid or tampered type parameter." });
  }

  const { receipt, subject, decryptedMessage, decryptedName } = prepareEmailDetails(hashedType, name, message);

  try {
    // 1. Envoi à l'admin (template admin)
    const html = await generateHtmlContent(decryptedName, decryptedMessage, sender);
    const emailResult = await sendEmail(sender, receipt, subject, html);

    // 2. Envoi au client (template client)
    const clientTemplatePath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'Templates', 'clientEmailTemplate.ejs');
    const date = new Date().toLocaleDateString();
    const clientHtml = await ejs.renderFile(clientTemplatePath, {
      name: decryptedName,
      message: decryptedMessage,
      date: date
    });
    // L'admin est l'expéditeur, le client est le destinataire
    await sendEmail('support@bedouielectransormateur.com', sender, 'Thank you for contacting BedouiElec', clientHtml);

    console.log("Résultat de l'envoi d'email :", emailResult);
    res.status(200).json({ message: "Email sent successfully!", emailResult });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).json({ message: "Error sending email." });
  }
};
