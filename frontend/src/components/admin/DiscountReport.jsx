import React, { useState } from 'react';
import { Button, Modal, Form, Select, DatePicker, Checkbox, message, Spin } from 'antd';
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import logo from '../../assets/Logo/logo-white.png';

const { Option } = Select;
const { RangePicker } = DatePicker;

const DiscountReport = ({ discounts, packages }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const generatePDF = async (values) => {
    setGenerating(true);
    try {
      // Filter discounts based on user selection
      let filteredDiscounts = [...discounts];
      
      // Filter by status
      if (values.status === 'active') {
        const now = new Date();
        filteredDiscounts = filteredDiscounts.filter(
          discount => new Date(discount.startDate) <= now && new Date(discount.endDate) >= now
        );
      } else if (values.status === 'upcoming') {
        const now = new Date();
        filteredDiscounts = filteredDiscounts.filter(
          discount => new Date(discount.startDate) > now
        );
      } else if (values.status === 'expired') {
        const now = new Date();
        filteredDiscounts = filteredDiscounts.filter(
          discount => new Date(discount.endDate) < now
        );
      }
      
      // Filter by date range if selected
      if (values.dateRange) {
        const startDate = values.dateRange[0].startOf('day').toDate();
        const endDate = values.dateRange[1].endOf('day').toDate();
        
        filteredDiscounts = filteredDiscounts.filter(discount => {
          const discountStart = new Date(discount.startDate);
          const discountEnd = new Date(discount.endDate);
          return (discountStart <= endDate && discountEnd >= startDate);
        });
      }
      
      // Filter by package if selected
      if (values.package && values.package !== 'all') {
        filteredDiscounts = filteredDiscounts.filter(discount => {
          if (!discount.applicablePackages || discount.applicablePackages.length === 0) {
            return true;
          }
          return discount.applicablePackages.some(pkg => pkg._id === values.package);
        });
      }

      // Create the PDF document
      const doc = new jsPDF();
      
      // Add logo to the top right corner
      const imgWidth = 30; // Adjust size as needed
      const imgHeight = 30; // Adjust size as needed
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(logo, 'PNG', pageWidth - imgWidth - 14, 12, imgWidth, imgHeight);
      
      // Add title with green color and bold
      doc.setFontSize(24);
      doc.setTextColor(33, 150, 83); // RGB values for a nice green color
      doc.setFont(undefined, 'bold'); // Set font to bold
      doc.text('Discount Report', 14, 25);
      doc.setFont(undefined, 'normal'); // Reset font to normal
      doc.setTextColor(0, 0, 0); // Reset text color to black for rest of the content
      
      // Add report generation info
      doc.setFontSize(10);
      doc.text(`Generated on: ${moment().format('MMMM D, YYYY [at] h:mm A')}`, 14, 38);
      
      // Filters Applied Table
      let yPos = 48;
      doc.setFontSize(14); // Increased font size for subtopic
      doc.setTextColor(33, 150, 83); // Green color
      doc.text('Filters Applied:', 14, yPos);
      doc.setFontSize(11); // Reset for table
      doc.setTextColor(0, 0, 0); // Reset to black
      yPos += 6;

      const filterTable = [
        ['Status', values.status.charAt(0).toUpperCase() + values.status.slice(1) || 'All'],
      ];
      if (values.dateRange) {
        filterTable.push(['Date Range', 
          `${values.dateRange[0].format('YYYY-MM-DD')} to ${values.dateRange[1].format('YYYY-MM-DD')}`]);
      }
      if (values.package && values.package !== 'all') {
        const packageName = packages.find(p => p._id === values.package)?.name || values.package;
        filterTable.push(['Package', packageName]);
      }

      doc.autoTable({
        head: [['Filter', 'Value']],
        body: filterTable,
        startY: yPos,
        headStyles: { fillColor: [33, 150, 83] },
        margin: { left: 14 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 100 }
        }
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // Add Discount Details subtopic
      doc.setFontSize(14); // Increased font size for subtopic
      doc.setTextColor(33, 150, 83); // Green color
      doc.text('Discount Details:', 14, yPos);
      doc.setFontSize(11); // Reset for table
      doc.setTextColor(0, 0, 0); // Reset to black
      yPos += 6;

      // Create the main discounts table
      const tableColumn = values.includeFields.map(field => {
        switch(field) {
          case 'discountId': return 'Discount ID';
          case 'name': return 'Name';
          case 'description': return 'Description';
          case 'value': return 'Value';
          case 'applicablePackages': return 'Packages';
          case 'startDate': return 'Start Date';
          case 'endDate': return 'End Date';
          default: return field.charAt(0).toUpperCase() + field.slice(1);
        }
      });

      const tableRows = filteredDiscounts.map(discount => {
        const row = [];
        values.includeFields.forEach(field => {
          switch(field) {
            case 'discountId':
              row.push(discount.discountId || 'N/A');
              break;
            case 'name':
              row.push(discount.name || 'N/A');
              break;
            case 'description':
              row.push(discount.description || 'N/A');
              break;
            case 'value':
              row.push(discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`);
              break;
            case 'applicablePackages':
              row.push(discount.applicablePackages?.length > 0 
                ? discount.applicablePackages.map(pkg => pkg.name).join(', ') 
                : 'All Packages');
              break;
            case 'startDate':
              row.push(moment(discount.startDate).format('YYYY-MM-DD'));
              break;
            case 'endDate':
              row.push(moment(discount.endDate).format('YYYY-MM-DD'));
              break;
            default:
              row.push(discount[field] || 'N/A');
          }
        });
        return row;
      });

      // Add the main discounts table
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        headStyles: { fillColor: [33, 150, 83] },
        margin: { left: 14 },
        didDrawPage: (data) => {
          doc.setFontSize(10);
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          doc.text('Page ' + data.pageNumber, data.settings.margin.left, pageHeight - 10);
        }
      });

      // Summary Table
      yPos = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14); // Increased font size for subtopic
      doc.setTextColor(33, 150, 83); // Green color
      doc.text('Summary:', 14, yPos);
      doc.setFontSize(11); // Reset for table
      doc.setTextColor(0, 0, 0); // Reset to black
      yPos += 6;

      const activeDiscounts = filteredDiscounts.filter(
        discount => new Date(discount.startDate) <= new Date() && new Date(discount.endDate) >= new Date()
      ).length;

      const summaryTable = [
        ['Total Discounts', filteredDiscounts.length],
        ['Active Discounts', activeDiscounts]
      ];

      doc.autoTable({
        head: [['Metric', 'Value']],
        body: summaryTable,
        startY: yPos,
        headStyles: { fillColor: [33, 150, 83] },
        margin: { left: 14 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30 }
        }
      });

      // Save the PDF
      const filename = `Discount_Report_${moment().format('YYYY-MM-DD')}.pdf`;
      doc.save(filename);
      
      message.success('Report generated successfully!');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = (values) => {
    generatePDF(values);
  };

  return (
    <>
      <Button 
        type="primary" 
        icon={<FileTextOutlined />} 
        onClick={showModal}
        style={{ 
          backgroundColor: '#1890ff',
          marginLeft: '10px'
        }}
      >
        Generate Report
      </Button>
      
      <Modal
        title="Generate Discount Report"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSubmit}
          initialValues={{
            status: 'all',
            package: 'all',
            includeFields: ['discountId', 'name', 'value', 'startDate', 'endDate']
          }}
        >
          <Form.Item name="status" label="Discount Status">
            <Select>
              <Option value="all">All Discounts</Option>
              <Option value="active">Active Discounts</Option>
              <Option value="upcoming">Upcoming Discounts</Option>
              <Option value="expired">Expired Discounts</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="dateRange" label="Date Range">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="package" label="Package Filter">
            <Select>
              <Option value="all">All Packages</Option>
              {packages.map(pkg => (
                <Option key={pkg._id} value={pkg._id}>{pkg.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="includeFields" label="Include Fields">
            <Checkbox.Group options={[
              { label: 'Discount ID', value: 'discountId' },
              { label: 'Name', value: 'name' },
              { label: 'Description', value: 'description' },
              { label: 'Value', value: 'value' },
              { label: 'Applicable Packages', value: 'applicablePackages' },
              { label: 'Start Date', value: 'startDate' },
              { label: 'End Date', value: 'endDate' },
            ]} />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<DownloadOutlined />} 
              disabled={generating}
              style={{ width: '100%' }}
            >
              {generating ? <Spin size="small" /> : 'Download PDF Report'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DiscountReport;