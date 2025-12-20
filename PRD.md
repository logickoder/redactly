# **Product Requirements Document: Redactly (PWA)**

Version: 1.1  
Date: 2025-12-13  
Product Goal: To provide a simple, secure, client-side tool for users to prepare sensitive WhatsApp chat data for external analysis (e.g., by AI models) by guaranteeing anonymity and scope control.

## **1\. Goal and Success Metrics**

### **1.1 Project Goal**

The primary goal is to create a Progressive Web App (PWA) that operates **100% offline** (after initial load) to ensure user privacy by processing sensitive chat data solely on the client's device. The application must simplify the complex task of manually redacting names and filtering conversations by date.

### **1.2 Success Metrics**

| Metric | Definition | Target |
| :---- | :---- | :---- |
| **PWA Install Rate** | Percentage of users who install the app to their home screen/desktop. | \>15% |
| **Core Conversion Rate** | Percentage of users who successfully upload, process, and download a chat. | \>80% |
| **Privacy Trust** | Low volume of support requests/comments related to data security. | \<5% |
| **Performance** | Time taken to process a 10MB chat file after initial load. | \< 5s |

## **2\. Core Feature Requirements**

### **2.1 User Stories**

| ID | User Story | Priority |
| :---- | :---- | :---- |
| **FS-1** | Upload a standard WhatsApp .txt chat export file. | **High** |
| **FS-2** | Automatically detect all unique participant names in the chat. | **High** |
| **FS-3** | Assign anonymous aliases (e.g., "User A") to original names. | **High** |
| **FS-4** | Specify a start and end date to trim the conversation scope. | **High** |
| **FS-5** | Maintain original chat structure (timestamps, line breaks) in the output. | **High** |
| **FS-6** | Copy anonymized text to clipboard or download as a new .txt file. | **High** |
| **FS-7** | Receive feedback if file format is incorrect or processing fails. | Medium |
| **FS-8** | Available and fully functional even when completely offline. | **High** |

## **3\. Technical Requirements**

### **3.1 Platform and Architecture**

* **Type:** Progressive Web Application (PWA).
* **Tech Stack:** React, TypeScript, Vite, Tailwind CSS.
* **Offline Capability:** Mandatory Service Worker for caching static assets.
* **Data Processing:** Client-Side Only (In-memory processing via JS).

### **3.2 Data Handling**

* **Input:** WhatsApp .txt export via FileReader.
* **Parsing:** Regex identification of \[Timestamp\] Name: Message.
* **Output:** Plain Text (.txt).

## **4\. Design and UX Specifications**

### **4.1 Color Scheme (Dark Mode)**

* **Primary Accent:** \#075E54 (WhatsApp Green)
* **Secondary Accent:** \#DCF8C6 (Light Highlights)
* **Background:** \#1D2633 (Charcoal Gray)
* **Card BG:** \#2C3E50 (Dark Gray)
* **Text:** \#ECF0F1 (Off-White)

### **4.2 Layout**

1. **Centered Layout:** Mobile-first, responsive design.
2. **Three-Step Workflow:** \- Step 1: Upload & Parse
    * Step 2: Configure Privacy & Scope
    * Step 3: Export
3. **Output Display:** Read-only, scrollable monospace text area.