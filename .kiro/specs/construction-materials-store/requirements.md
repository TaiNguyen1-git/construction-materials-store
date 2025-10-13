# Requirements Document

## Introduction

This document outlines the requirements for a comprehensive Construction Materials Store Management System. The system will manage all aspects of a construction materials retail business, including employee management, inventory control, invoicing, customer relations, supplier management, and AI-powered features. Additionally, it will provide a customer-facing website with e-commerce capabilities, chatbot support, and voice calling functionality.

The system serves both internal users (managers and employees) and external customers, with AI integration for OCR invoice processing, inventory prediction, and automated customer support.

## Requirements

### Requirement 1: Employee Management and Work Shift System

**User Story:** As a manager, I want to manage employee information and work schedules, so that I can efficiently organize staff operations and track attendance.

#### Acceptance Criteria

1. WHEN a manager accesses the employee management module THEN the system SHALL display options to add, edit, or delete employee records
2. WHEN creating an employee record THEN the system SHALL require name, contact information, role, and permissions
3. WHEN assigning work shifts THEN the system SHALL allow managers to create and assign shifts to employees
4. WHEN employees clock in/out THEN the system SHALL record timestamps for attendance tracking
5. WHEN generating attendance reports THEN the system SHALL provide weekly and monthly summaries
6. WHEN assigning tasks to loading/transport staff THEN the system SHALL track task completion status

### Requirement 2: Payroll and Salary Advance Management

**User Story:** As a manager, I want to calculate employee salaries and manage salary advances, so that I can ensure accurate and timely compensation.

#### Acceptance Criteria

1. WHEN calculating monthly salaries for sales/warehouse staff THEN the system SHALL compute base salary + bonuses - penalties - advances
2. WHEN calculating pay for loading staff THEN the system SHALL support both per-shift and per-completed-order payment methods
3. WHEN recording salary advances THEN the system SHALL capture amount, reason, date, and employee information
4. WHEN tracking advance history THEN the system SHALL allow filtering by employee and time period
5. WHEN generating payroll reports THEN the system SHALL include base salary, bonuses, penalties, total advances, and net pay
6. WHEN an advance is requested THEN the system SHALL update the employee's advance balance automatically

### Requirement 3: Product and Inventory Management

**User Story:** As a manager, I want to manage product catalog and inventory levels, so that I can maintain accurate stock information and prevent stockouts.

#### Acceptance Criteria

1. WHEN managing products THEN the system SHALL support adding, editing, and deleting products with name, category, price, unit, and images
2. WHEN receiving inventory THEN the system SHALL update stock levels based on supplier invoices
3. WHEN selling products THEN the system SHALL automatically reduce inventory quantities
4. WHEN conducting inventory audits THEN the system SHALL support periodic stock counting and adjustments
5. WHEN stock levels are low THEN the system SHALL generate low-stock alerts
6. WHEN generating inventory reports THEN the system SHALL show current stock levels and movement history

### Requirement 4: Invoice and Transaction Management

**User Story:** As an employee, I want to create and manage various types of invoices, so that I can accurately record all business transactions.

#### Acceptance Criteria

1. WHEN creating sales invoices THEN the system SHALL generate PDF invoices and update inventory automatically
2. WHEN recording supplier invoices THEN the system SHALL update inventory and supplier payables
3. WHEN processing returns from customers THEN the system SHALL reduce customer debt and update inventory
4. WHEN processing returns to suppliers THEN the system SHALL update inventory and supplier payables
5. WHEN searching invoices THEN the system SHALL support filtering by date range and customer
6. WHEN managing accounts receivable/payable THEN the system SHALL track outstanding balances

### Requirement 5: Customer and Supplier Management

**User Story:** As an employee, I want to manage customer and supplier information, so that I can maintain business relationships and track transaction history.

#### Acceptance Criteria

1. WHEN managing customers THEN the system SHALL store name, phone, address, email, and transaction history
2. WHEN categorizing customers THEN the system SHALL support VIP and regular customer classifications
3. WHEN managing suppliers THEN the system SHALL store contact information and track purchase history
4. WHEN recording supplier transactions THEN the system SHALL update supplier payables automatically
5. WHEN generating supplier reports THEN the system SHALL show expenses by supplier
6. WHEN viewing customer profiles THEN the system SHALL display complete transaction history

### Requirement 6: AI Integration Features

**User Story:** As an employee, I want AI-powered tools to automate routine tasks, so that I can work more efficiently and reduce manual errors.

#### Acceptance Criteria

1. WHEN customers interact with the chatbot THEN the system SHALL provide automated responses about pricing, inventory, and store hours
2. WHEN processing supplier invoices THEN the OCR system SHALL extract product details, quantities, and prices from photographed invoices
3. WHEN OCR processing is complete THEN the system SHALL display a draft for employee review and approval
4. WHEN analyzing sales data THEN the AI system SHALL predict which products need restocking
5. WHEN generating purchase recommendations THEN the system SHALL suggest optimal quantities based on historical data
6. WHEN AI predictions are generated THEN the system SHALL provide confidence scores and reasoning
7. WHEN customers browse products THEN the AI system SHALL recommend related or complementary products
8. WHEN customers view their purchase history THEN the system SHALL suggest products they might need again

### Requirement 7: Customer Website and E-commerce

**User Story:** As a customer, I want to browse products and place orders online, so that I can shop conveniently from anywhere.

#### Acceptance Criteria

1. WHEN browsing the website THEN the system SHALL display products with names, prices, stock levels, and images
2. WHEN searching for products THEN the system SHALL provide relevant results based on keywords
3. WHEN adding items to cart THEN the system SHALL maintain cart state across sessions
4. WHEN placing orders THEN the system SHALL collect customer information and payment preferences
5. WHEN orders are submitted THEN the system SHALL generate order confirmations and update inventory
6. WHEN tracking orders THEN customers SHALL be able to view current order status
7. WHEN orders are completed THEN customers SHALL be able to view and download invoices
8. WHEN needing assistance THEN customers SHALL have access to chatbot support