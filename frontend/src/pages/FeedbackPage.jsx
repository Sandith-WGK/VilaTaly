import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Input, Rate, Pagination, message } from 'antd';
import { LikeOutlined, DislikeOutlined, LikeFilled, DislikeFilled } from '@ant-design/icons';
import axios from 'axios';

const FeedbackPage = () => {

    const [userID, setUserID] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(9); // Show 9 feedbacks at a time
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [visibleAdd, setVisibleAdd] = useState(false);
    const [visibleEdit, setVisibleEdit] = useState(false);
    const [visibleDelete, setVisibleDelete] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
      }, []);

    // Fetch user ID from local storage
    const fetchUserByID = useCallback(() => {
        const userJSON = localStorage.getItem("currentUser");
        if (!userJSON) {
            console.error("User not found in localStorage.");
            return;
        }
        const user = JSON.parse(userJSON);
        setUserID(user.userID); // Retrieve and set userID
    }, []);

    useEffect(() => {
        fetchUserByID();
    }, [fetchUserByID]);

    useEffect(() => {
        fetchFeedbacks();
    }, [page, search]);

    const fetchFeedbacks = async () => {
        try {
            const { data } = await axios.post('/api/feedback/searchFeedback', {
                search,
                page,
                limit
            });
            setFeedbacks(data.feedbacks);
            setTotal(data.total);
        } catch (error) {
            message.error('Error fetching feedbacks');
        }
    };

    const handleAddFeedback = async (values) => {
        try {
            console.log("Submitting feedback with values:", values);
            console.log("User ID:", userID);
            const feedbackData = { 
                ...values, 
                userID: values.username === 'Anonymous' ? null : userID 
            };
            console.log("Feedback Data being sent:", feedbackData);
            const response = await axios.post('/api/feedback/addFeedback', feedbackData);
            console.log("Response data:", response.data);

            if (response.status === 201) {
                message.success('Feedback added successfully');
                fetchFeedbacks();
                setVisibleAdd(false);
            } else {
                message.error('Failed to add feedback');
            }
        } catch (error) {
            console.error("Error in handleAddFeedback:", error.response ? error.response.data : error.message);
            message.error('Error adding feedback');
        }
    };

    const handleEditFeedback = async (values) => {
        try {
            await axios.post('/api/feedback/updateFeedback', { feedbackID: currentFeedback._id, ...values });
            message.success('Feedback updated successfully');
            fetchFeedbacks();
            setVisibleEdit(false);
        } catch (error) {
            message.error('Error updating feedback');
        }
    };

    const handleDeleteFeedback = async () => {
        try {
            await axios.post('/api/feedback/deleteFeedback', { feedbackID: currentFeedback._id });
            message.success('Feedback deleted successfully');
            fetchFeedbacks();
            setVisibleDelete(false);
        } catch (error) {
            message.error('Error deleting feedback');
        }
    };

    const handleSearch = async (e) => {
        const value = e.target.value;
        setSearch(value);
        setPage(1);
    };

    // Like a feedback
    const handleLike = async (feedbackID) => {
        try {
            const { data } = await axios.post(`/api/feedback/${feedbackID}/like`, { userID });
            setFeedbacks(feedbacks.map(feedback => feedback._id === feedbackID ? data.feedback : feedback));
        } catch (error) {
            message.error('Error liking feedback');
        }
    };



    // Dislike a feedback
    const handleDislike = async (feedbackID) => {
        try {
            const { data } = await axios.post(`/api/feedback/${feedbackID}/dislike`, { userID });
            setFeedbacks(feedbacks.map(feedback => feedback._id === feedbackID ? data.feedback : feedback));
        } catch (error) {
            message.error('Error disliking feedback');
        }
    };

    return (
        <div className="feedback-page-6789">
            <h1 className="feedback-title" style={{ marginBottom: 20, marginLeft: 5 }}>Feedbacks..</h1>
            <hr />
            <div className="feedback-header-6789">
                <Input.Search
                    placeholder="Search"
                    value={search}
                    onChange={handleSearch}
                    style={{ width: 300 }}
                />
                <Button type="primary" style={{ backgroundColor: '#25b05f' }} onClick={() => setVisibleAdd(true)}>
                    Add Feedback
                </Button>
            </div>
            <div className="feedback-list-6789">
                {feedbacks.map(feedback => {
                    console.log(feedback._id); // This will log the feedback ID to the console

                    return (
                        <div key={feedback._id} className="feedback-card-6789">
                            <h3>{feedback.title}</h3>
                            <p>
                                <strong>{feedback.username}</strong>
                                <span style={{ 
                                    marginLeft: '10px', 
                                    color: '#666', 
                                    fontSize: '0.9em',
                                    fontStyle: 'italic'
                                }}>
                                    • {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </p>
                            <p>{feedback.description}</p>
                            <Rate disabled defaultValue={feedback.rating} />
                            <div style={{ marginTop: 10 }}>
                                <Button
                                    type="text"
                                    icon={feedback.likedBy.includes(userID) ? <LikeFilled /> : <LikeOutlined />}
                                    onClick={() => {
                                        handleLike(feedback._id);  // Ensure feedback._id is passed correctly
                                    }}
                                    style={{ color: feedback.likedBy.includes(userID) ? '#1890ff' : 'inherit', marginRight: 8 }}
                                    disabled={!userID}  // Disable the button if userID is null or undefined
                                >
                                    Like {feedback.likes}
                                </Button>
                                <Button
                                    type="text"
                                    icon={feedback.dislikedBy.includes(userID) ? <DislikeFilled /> : <DislikeOutlined />}
                                    onClick={() => {
                                        handleDislike(feedback._id);  // Ensure feedback._id is passed correctly
                                    }}
                                    style={{ color: feedback.dislikedBy.includes(userID) ? '#ff4d4f' : 'inherit' }}
                                    disabled={!userID}  // Disable the button if userID is null or undefined
                                >
                                    Dislike {feedback.dislikes}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <Pagination
                current={page}
                pageSize={limit} // Shows 9 cards per page
                total={total}
                onChange={setPage}
                style={{ textAlign: 'center', marginTop: '20px' }}
            />
            <AddFeedbackModal
                visible={visibleAdd}
                onCancel={() => setVisibleAdd(false)}
                onSubmit={handleAddFeedback}
                userID={userID}
            />
            <EditFeedbackModal
                visible={visibleEdit}
                onCancel={() => setVisibleEdit(false)}
                onSubmit={handleEditFeedback}
                feedback={currentFeedback}
            />
            <DeleteFeedbackModal
                visible={visibleDelete}
                onCancel={() => setVisibleDelete(false)}
                onConfirm={handleDeleteFeedback}
            />
        </div>
    );
};



const AddFeedbackModal = ({ visible, onCancel, onSubmit, userID }) => {
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const MAX_WORDS = 200;

    const feedbackTitles = [
        'Room Cleanliness',
        'Staff Service',
        'Food Quality',
        'Room Comfort',
        'Hotel Location',
        'Value for Money',
        'Facilities & Amenities',
        'Check-in/Check-out Experience',
        'Room Service',
        'Hotel Maintenance',
        'WiFi Quality',
        'Parking Facilities',
        'Swimming Pool',
        'Gym Facilities',
        'Restaurant Service',
        'Other'
    ];

    // Reset form fields when modal is closed
    useEffect(() => {
        if (!visible) {
            setTitle('');
            setUsername('');
            setRating(0);
            setDescription('');
            setIsAnonymous(false);
            setWordCount(0);
        }
    }, [visible]);

    // Fetch username from localStorage when component mounts
    useEffect(() => {
        const userJSON = localStorage.getItem("currentUser");
        if (userJSON) {
            const user = JSON.parse(userJSON);
            setUsername(user.username || '');
        }
    }, []);

    const handleDescriptionChange = (e) => {
        const text = e.target.value;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
        setDescription(text);
    };

    const handleSubmit = () => {
        if (!title || !description) {
            message.error('Please fill in title and description');
            return;
        }
        if (wordCount > MAX_WORDS) {
            message.error(`Description cannot exceed ${MAX_WORDS} words`);
            return;
        }
        const feedbackData = { 
            title, 
            username: isAnonymous ? 'Anonymous' : username, 
            rating, 
            description, 
            userID 
        };
        onSubmit(feedbackData);
    };

    return (
        <Modal
            title="Add Feedback"
            visible={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            okText="Save"
            width={600}
        >
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Feedback Title *</label>
                <select 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                >
                    <option value="">Select a feedback category</option>
                    {feedbackTitles.map((title, index) => (
                        <option key={index} value={title}>{title}</option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Username</label>
                <Input 
                    value={username} 
                    disabled={!isAnonymous}
                    style={{ marginBottom: '5px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        style={{ marginRight: '8px' }}
                    />
                    <label htmlFor="anonymous">Post as Anonymous</label>
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Rating (Optional)</label>
                <Rate value={rating} onChange={setRating} />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                    Description * ({wordCount}/{MAX_WORDS} words)
                </label>
                <Input.TextArea 
                    placeholder={`Enter your feedback (maximum ${MAX_WORDS} words)`}
                    value={description} 
                    onChange={handleDescriptionChange}
                    style={{ marginTop: '5px' }}
                    rows={4}
                />
                <div style={{ 
                    color: wordCount > MAX_WORDS ? 'red' : 'inherit',
                    fontSize: '12px',
                    marginTop: '5px'
                }}>
                    {wordCount > MAX_WORDS ? `Word limit exceeded by ${wordCount - MAX_WORDS} words` : ''}
                </div>
            </div>
        </Modal>
    );
};

const EditFeedbackModal = ({ visible, onCancel, onSubmit, feedback }) => {
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState('');

    // Reset form fields when feedback changes
    useEffect(() => {
        if (feedback) {
            setTitle(feedback.title || '');
            setUsername(feedback.username || '');
            setRating(feedback.rating || 0);
            setDescription(feedback.description || '');
        }
    }, [feedback]);

    const handleSubmit = () => {
        if (!title || !username || rating === 0 || !description) {
            message.error('Please fill in all fields');
            return;
        }
        onSubmit({ title, username, rating, description });
    };

    return (
        <Modal
            title="Edit Feedback"
            visible={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            okText="Update"
        >
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ marginTop: '10px' }} />
            <Rate value={rating} onChange={setRating} style={{ marginTop: '10px' }} />
            <Input.TextArea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginTop: '10px' }} />
        </Modal>
    );
};

const DeleteFeedbackModal = ({ visible, onCancel, onConfirm }) => (
    <Modal
        title="Delete Feedback"
        visible={visible}
        onCancel={onCancel}
        onOk={onConfirm}
        okText="Delete"
        okButtonProps={{ danger: true }}
    >
        <p>Are you sure you want to delete this feedback?</p>
    </Modal>
);

export default FeedbackPage;
