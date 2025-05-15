import { DeleteOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, InputNumber, message, Modal, Select, Space, Table } from "antd";
import axios from "axios";
import moment from "moment";
import { useEffect, useState } from "react";

const { Option } = Select;

const DailyUsage = () => {
    const [form] = Form.useForm();
    const [inventoryItems, setInventoryItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [usageHistory, setUsageHistory] = useState([]);

    // Fetch inventory items for dropdown
    const fetchInventoryItems = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:5000/api/daily-usage/items");
            setInventoryItems(response.data);
        } catch (error) {
            console.error("Failed to load inventory items:", error.message, error.stack);
            message.error("Failed to load inventory items");
        } finally {
            setLoading(false);
        }
    };

    // Fetch daily usage history
    const fetchUsageHistory = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:5000/api/daily-usage/history");
            const history = response.data;
            console.log("Usage History:", history);
            // Filter out invalid items
            const filteredHistory = history.map((record) => ({
                ...record,
                items: record.items.filter(
                    (item) => item.item && item.item._id && item.item.name
                ),
            })).filter((record) => record.items.length > 0);
            setUsageHistory(filteredHistory);
            if (filteredHistory.length < history.length) {
                message.warning("Some history records were skipped due to missing item data.");
            }
        } catch (error) {
            console.error("Failed to fetch usage history:", error.message, error.stack);
            message.error("Failed to fetch daily usage history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventoryItems();
    }, []);

    // Handle adding a new item
    const handleAddItem = (itemId) => {
        if (selectedItems.length >= 5) {
            message.warning("Cannot add more than 5 items");
            return;
        }
        const item = inventoryItems.find((i) => i._id === itemId);
        if (!item) return;
        if (selectedItems.some((i) => i.item === itemId)) {
            message.warning("Item already selected");
            return;
        }
        setSelectedItems([...selectedItems, { item: itemId, name: item.name, quantityUsed: 1 }]);
        form.setFieldsValue({ item: undefined });
    };

    // Handle quantity change
    const handleQuantityChange = (index, delta) => {
        const newItems = [...selectedItems];
        const newQuantity = newItems[index].quantityUsed + delta;
        if (newQuantity < 1) {
            message.warning("Quantity cannot be less than 1");
            return;
        }
        const item = inventoryItems.find((i) => i._id === newItems[index].item);
        if (newQuantity > item.stockQuantity) {
            message.warning(`Cannot exceed available stock (${item.stockQuantity})`);
            return;
        }
        newItems[index].quantityUsed = newQuantity;
        setSelectedItems(newItems);
    };

    // Handle delete item
    const handleDeleteItem = (index) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    // Handle form submission
    const handleSubmit = async () => {
        try {
            if (selectedItems.length === 0) {
                message.warning("Please select at least one item");
                return;
            }
            setLoading(true);
            const payload = {
                date: new Date(),
                items: selectedItems.map(({ item, quantityUsed }) => ({ item, quantityUsed })),
            };
            await axios.post("http://localhost:5000/api/daily-usage/add", payload);
            message.success("Daily usage recorded successfully");
            setSelectedItems([]);
            fetchInventoryItems();
        } catch (error) {
            console.error("Failed to record daily usage:", error.message, error.stack);
            message.error(error.response?.data?.error || "Failed to record daily usage");
        } finally {
            setLoading(false);
        }
    };

    // Handle opening history modal
    const showHistoryModal = () => {
        fetchUsageHistory();
        setHistoryModalVisible(true);
    };

    // Table columns for selected items
    const columns = [
        {
            title: "Item Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Quantity",
            key: "quantity",
            render: (_, record, index) => (
                <Space>
                    <Button
                        icon={<MinusOutlined />}
                        size="small"
                        onClick={() => handleQuantityChange(index, -1)}
                        disabled={record.quantityUsed <= 1}
                    />
                    <InputNumber
                        value={record.quantityUsed}
                        size="small"
                        min={1}
                        style={{ width: 60, height: 28 }}
                        readOnly
                    />
                    <Button
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => handleQuantityChange(index, 1)}
                    />
                </Space>
            ),
        },
        {
            title: "Action",
            key: "action",
            render: (_, __, index) => (
                <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    onClick={() => handleDeleteItem(index)}
                />
            ),
        },
    ];

    // Table columns for history items (nested table)
    const historyItemColumns = [
        {
            title: "Item Name",
            dataIndex: ["item", "name"],
            key: "name",
        },
        {
            title: "Quantity Used",
            dataIndex: "quantityUsed",
            key: "quantityUsed",
        },
    ];

    // Table columns for history
    const historyColumns = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            render: (date) => moment(date).format("YYYY-MM-DD"),
        },
        {
            title: "Items",
            key: "items",
            render: (_, record) => (
                <Table
                    columns={historyItemColumns}
                    dataSource={record.items}
                    rowKey={(item) => (item.item && item.item._id) || `fallback-${Math.random()}`}
                    pagination={false}
                    size="small"
                    bordered
                />
            ),
        },
    ];

    return (
        <div style={{ padding: "16px" }}>
            <h1 style={{ marginBottom: 8 }}>Daily Usage</h1>
            <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                <Form.Item name="item" label="Select Item">
                    <Select
                        placeholder="Select an item"
                        style={{ width: 200, height: 28 }}
                        onChange={handleAddItem}
                        loading={loading}
                        size="small"
                        allowClear
                    >
                        {inventoryItems.map((item) => (
                            <Option key={item._id} value={item._id}>
                                {item.name} (Stock: {item.stockQuantity})
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={loading}
                        size="small"
                        style={{ height: 28 }}
                    >
                        Submit Usage
                    </Button>
                </Form.Item>
                <Form.Item>
                    <Button
                        type="default"
                        onClick={showHistoryModal}
                        size="small"
                        style={{ height: 28 }}
                    >
                        View History
                    </Button>
                </Form.Item>
            </Form>
            <Table
                columns={columns}
                dataSource={selectedItems}
                rowKey="item"
                pagination={false}
                bordered
                size="small"
                locale={{ emptyText: "No items selected" }}
            />
            <Modal
                title="Daily Usage History"
                open={historyModalVisible}
                onCancel={() => setHistoryModalVisible(false)}
                footer={[
                    <Button
                        key="close"
                        onClick={() => setHistoryModalVisible(false)}
                        size="small"
                    >
                        Close
                    </Button>,
                ]}
                width={800}
            >
                <Table
                    columns={historyColumns}
                    dataSource={usageHistory}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 5 }}
                    bordered
                    size="small"
                    locale={{ emptyText: "No history available" }}
                />
            </Modal>
        </div>
    );
};

export default DailyUsage;