import React, { useState } from "react";
import Navbar from './../components/CommonComponents/Navbar';
import axios from 'axios';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
    });

    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        
        // Clear error when user starts typing
        setErrors({
            ...errors,
            [name]: ''
        });
    };

    const validateField = (name, value) => {
        switch (name) {
            case 'firstName':
            case 'lastName':
                // Check if name contains only letters and has proper length
                if (!value.trim()) {
                    return 'This field is required';
                }
                if (!/^[A-Za-z]+$/.test(value)) {
                    return 'Only letters are allowed';
                }
                if (value.length < 2) {
                    return 'Name must be at least 2 characters';
                }
                if (value.length > 50) {
                    return 'Name must be less than 50 characters';
                }
                break;
            case 'username':
                // Check username length and format
                if (!value.trim()) {
                    return 'Username is required';
                }
                if (value.length < 3) {
                    return 'Username must be at least 3 characters';
                }
                if (value.length > 30) {
                    return 'Username must be less than 30 characters';
                }
                if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                    return 'Username can only contain letters, numbers, and underscores';
                }
                break;
            case 'email':
                // Check for valid email format (case-insensitive)
                if (!value.trim()) {
                    return 'Email is required';
                }
                // Check for capital letters
                if (value !== value.toLowerCase()) {
                    return 'Email must be in lowercase';
                }
                const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
                if (!emailRegex.test(value)) {
                    return 'Please enter a valid email address';
                }
                break;
            case 'password':
                // Enhanced password validation
                if (!value.trim()) {
                    return 'Password is required';
                }
                if (value.length < 8) {
                    return 'Password must be at least 8 characters';
                }
                if (!/[A-Z]/.test(value)) {
                    return 'Password must contain at least one uppercase letter';
                }
                if (!/[a-z]/.test(value)) {
                    return 'Password must contain at least one lowercase letter';
                }
                if (!/[0-9]/.test(value)) {
                    return 'Password must contain at least one number';
                }
                if (!/[!@#$%^&*]/.test(value)) {
                    return 'Password must contain at least one special character (!@#$%^&*)';
                }
                break;
            case 'confirmPassword':
                // Check if passwords match
                if (!value.trim()) {
                    return 'Please confirm your password';
                }
                if (value !== formData.password) {
                    return 'Passwords do not match';
                }
                break;
            default:
                return '';
        }
        return '';
    };

    const validateForm = () => {
        const { firstName, lastName, email, username, password, confirmPassword, agreeToTerms } = formData;
        let isValid = true;
        const newErrors = {};

        // Check if all required fields are filled
        if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
            message.error('Please fill in all required fields.');
            isValid = false;
        }

        // Validate first name
        if (firstName) {
            const firstNameError = validateField('firstName', firstName);
            if (firstNameError) {
                newErrors.firstName = firstNameError;
                isValid = false;
            }
        }

        // Validate last name
        if (lastName) {
            const lastNameError = validateField('lastName', lastName);
            if (lastNameError) {
                newErrors.lastName = lastNameError;
                isValid = false;
            }
        }

        // Validate username
        if (username) {
            const usernameError = validateField('username', username);
            if (usernameError) {
                newErrors.username = usernameError;
                isValid = false;
            }
        }

        // Validate email
        if (email) {
            const emailError = validateField('email', email);
            if (emailError) {
                newErrors.email = emailError;
                isValid = false;
            }
        }

        // Validate password
        if (password) {
            const passwordError = validateField('password', password);
            if (passwordError) {
                newErrors.password = passwordError;
                isValid = false;
            }
        }

        // Validate password confirmation
        if (confirmPassword) {
            const confirmPasswordError = validateField('confirmPassword', confirmPassword);
            if (confirmPasswordError) {
                newErrors.confirmPassword = confirmPasswordError;
                isValid = false;
            }
        }

        // Check if terms and conditions are agreed to
        if (!agreeToTerms) {
            message.error('You must agree to the terms and conditions.');
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Perform front-end validation
        if (!validateForm()) {
            return;
        }

        try {
            // Convert email to lowercase before submission
            const formDataToSubmit = {
                ...formData,
                email: formData.email.toLowerCase()
            };

            const response = await axios.post('http://localhost:5000/api/user/signup', formDataToSubmit);

            if (response.status === 201) {
                message.success(response.data.message);

                // Save the user object to local storage
                localStorage.setItem('currentUser', JSON.stringify(response.data.user));

                // Redirect to the home page
                navigate('/');

                // Reset the form
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    username: '',
                    password: '',
                    confirmPassword: '',
                    agreeToTerms: false,
                });
            } else {
                message.error(response.data.message);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                message.error(error.response.data.message);
            } else {
                message.error('Something went wrong. Please try again.');
            }
        }
    };

    return (
        <div>
            <Navbar />
            <div className="sg_signup_page_main_container">
                <div className="sg_signup_page_form_container">
                    <h2 className="sg_signup_page_title">Sign up</h2>
                    <p className="sg_signup_page_subtitle">Enter your credentials to continue</p>
                    <form onSubmit={handleSubmit}>
                        <div className="sg_signup_page_input_group">
                            <div className="sg_input_wrapper">
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name"
                                    className={`sg_signup_page_input ${errors.firstName ? 'sg_input_error' : ''}`}
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    onBlur={(e) => {
                                        const validationError = validateField('firstName', e.target.value);
                                        setErrors({...errors, firstName: validationError});
                                    }}
                                />
                                {errors.firstName && <p className="sg_error_message">{errors.firstName}</p>}
                            </div>
                            <div className="sg_input_wrapper">
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name"
                                    className={`sg_signup_page_input ${errors.lastName ? 'sg_input_error' : ''}`}
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    onBlur={(e) => {
                                        const validationError = validateField('lastName', e.target.value);
                                        setErrors({...errors, lastName: validationError});
                                    }}
                                />
                                {errors.lastName && <p className="sg_error_message">{errors.lastName}</p>}
                            </div>
                        </div>
                        <div className="sg_signup_page_input_group">
                            <div className="sg_input_wrapper">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    className={`sg_signup_page_input ${errors.email ? 'sg_input_error' : ''}`}
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={(e) => {
                                        const validationError = validateField('email', e.target.value);
                                        setErrors({...errors, email: validationError});
                                    }}
                                />
                                {errors.email && <p className="sg_error_message">{errors.email}</p>}
                            </div>
                            <div className="sg_input_wrapper">
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    className={`sg_signup_page_input ${errors.username ? 'sg_input_error' : ''}`}
                                    value={formData.username}
                                    onChange={handleChange}
                                    onBlur={(e) => {
                                        const validationError = validateField('username', e.target.value);
                                        setErrors({...errors, username: validationError});
                                    }}
                                />
                                {errors.username && <p className="sg_error_message">{errors.username}</p>}
                            </div>
                        </div>
                        <div className="sg_signup_page_input_passwoard">
                       
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password (min 8 characters)"
                                    className={`sg_signup_page_input ${errors.password ? 'sg_input_error' : ''}`}
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={(e) => {
                                        const validationError = validateField('password', e.target.value);
                                        setErrors({...errors, password: validationError});
                                    }}
                                />
                                {errors.password && <p className="sg_error_message">{errors.password}</p>}
                           
                           
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    className={`sg_signup_page_input ${errors.confirmPassword ? 'sg_input_error' : ''}`}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={(e) => {
                                        const validationError = validateField('confirmPassword', e.target.value);
                                        setErrors({...errors, confirmPassword: validationError});
                                    }}
                                />
                                {errors.confirmPassword && <p className="sg_error_message">{errors.confirmPassword}</p>}
                           
                        </div>
                        <div className="sg_signup_page_checkbox_container">
                            <input
                                type="checkbox"
                                name="agreeToTerms"
                                id="terms"
                                className="sg_signup_page_checkbox"
                                checked={formData.agreeToTerms}
                                onChange={handleChange}
                            />
                            <label htmlFor="terms" className="sg_signup_page_terms">
                                I agree to all the <span className="sg_signup_page_terms_link">Terms</span> and <span className="sg_signup_page_terms_link">Privacy Policies</span>
                            </label>
                        </div>
                        <button type="submit" className="sg_signup_page_button">Create account</button>
                        <p className="sg_signup_page_login_text">Already have an account? <a href="/login" className="sg_signup_page_login_link">Login</a></p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default SignupPage;