import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const COMPANY_NAME = "Nizy Tailors";
const COMPANY_PHONE = "9876543210";

// --- HELPER: ROBUST DOWNLOAD ---
const saveFile = (blob, fileName) => {
    try {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error in saveFile:', error);
    }
};

// --- CUSTOMER EXPORT ---

export const exportCustomersToPDF = (customers) => {
    try {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Customer List', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 14, 30);

        const tableColumn = ["Name", "Reference", "Phone", "Measurements Summary"];
        const tableRows = [];

        customers.forEach(customer => {
            const measurements = [
                customer.measurements?.shirt ? 'Shirt' : '',
                customer.measurements?.pant ? 'Pant' : '',
                customer.measurements?.others?.length > 0 ? `+${customer.measurements.others.length} Others` : ''
            ].filter(Boolean).join(', ');

            const customerData = [
                customer.name,
                customer.referenceName || '-',
                customer.phone,
                measurements || 'None'
            ];
            tableRows.push(customerData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 10, cellPadding: 3 },
        });

        const blob = doc.output('blob');
        saveFile(blob, `customers_nizy_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    } catch (error) {
        console.error('Error in exportCustomersToPDF:', error);
        alert('Error: ' + error.message);
    }
};

export const exportCustomersToExcel = (customers) => {
    try {
        const data = customers.map(c => ({
            Name: c.name,
            Reference: c.referenceName || '-',
            Phone: c.phone,
            "Total Orders": c.totalOrders || 0,
            "Created At": c.createdAt?.seconds ? format(new Date(c.createdAt.seconds * 1000), 'yyyy-MM-dd') : '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        saveFile(blob, `customers_nizy_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    } catch (error) {
        console.error('Error in exportCustomersToExcel:', error);
    }
};

// --- BILLING EXPORT ---

export const exportOrdersToPDF = (orders) => {
    try {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Order Summary', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 14, 30);

        const tableColumn = ["Order ID", "Customer", "Phone", "Due Date", "Status", "Amount", "Balance"];
        const tableRows = [];

        orders.forEach(order => {
            const orderData = [
                `#${order.id.slice(-6).toUpperCase()}`,
                order.customerName,
                order.phone,
                order.dueDate ? format(new Date(order.dueDate), 'MMM d, yyyy') : '-',
                order.status,
                `₹${order.totalAmount}`,
                `₹${order.balanceAmount}`
            ];
            tableRows.push(orderData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 9, cellPadding: 2 },
        });

        const blob = doc.output('blob');
        saveFile(blob, `orders_nizy_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    } catch (error) {
        console.error('Error in exportOrdersToPDF:', error);
        alert('Error: ' + error.message);
    }
};

export const exportOrdersToExcel = (orders) => {
    const data = orders.map(order => ({
        "Order ID": `#${order.id.slice(-6).toUpperCase()}`,
        Customer: order.customerName,
        Phone: order.phone,
        "Due Date": order.dueDate ? format(new Date(order.dueDate), 'yyyy-MM-dd') : '-',
        Status: order.status,
        "Total Amount": order.totalAmount,
        "Paid Amount": order.paidAmount,
        "Balance": order.balanceAmount,
        "Items Summary": order.items.map(i => `${i.type} (${i.quantity})`).join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveFile(blob, `orders_nizy_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};

// --- INDIVIDUAL INVOICE PDF ---

export const generateInvoicePDF = (order) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.font = "helvetica";
        doc.setFont("helvetica", "bold");
        doc.text(COMPANY_NAME, 14, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Professional Tailoring Services", 14, 28);

        doc.text("INVOICE", pageWidth - 14, 20, { align: 'right' });
        doc.text(`#${order.id.slice(-6).toUpperCase()}`, pageWidth - 14, 28, { align: 'right' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Bill To:", 14, 55);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(order.customerName, 14, 62);
        doc.text(order.phone, 14, 68);

        doc.text("Date:", pageWidth - 50, 62);
        doc.text(format(new Date(), 'MMM d, yyyy'), pageWidth - 14, 62, { align: 'right' });

        doc.text("Due Date:", pageWidth - 50, 68);
        doc.text(order.dueDate ? format(new Date(order.dueDate), 'MMM d, yyyy') : '-', pageWidth - 14, 68, { align: 'right' });

        const tableColumn = ["Item", "Description", "Qty", "Price", "Total"];
        const tableRows = [];

        order.items.forEach(item => {
            tableRows.push([
                item.type.charAt(0).toUpperCase() + item.type.slice(1),
                "Custom Tailored",
                item.quantity,
                `₹${item.cost}`,
                `₹${item.quantity * item.cost}`
            ]);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 80,
            theme: 'grid',
            headStyles: { fillColor: [60, 60, 60], textColor: 255 },
            foot: [
                ['', '', '', 'Total', `₹${order.totalAmount}`],
                ['', '', '', 'Paid', `₹${order.paidAmount}`],
                ['', '', '', 'Balance', `₹${order.balanceAmount}`],
            ],
            footStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
        });

        const finalY = doc.lastAutoTable.finalY || 150;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Thank you for your business!", 14, finalY + 20);

        doc.setFontSize(9);
        doc.text("Terms & Conditions:", 14, finalY + 30);
        doc.text("1. No refunds on custom stitched items.", 14, finalY + 35);
        doc.text("2. Please collect items within 30 days of due date.", 14, finalY + 40);

        const blob = doc.output('blob');
        saveFile(blob, `Invoice_${order.customerName.replace(/\s+/g, '_')}_${order.id.slice(-6)}.pdf`);
    } catch (error) {
        console.error('Error in generateInvoicePDF:', error);
        alert('Error: ' + error.message);
    }
};
