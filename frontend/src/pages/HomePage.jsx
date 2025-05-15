import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Carousel, Button, Card, Avatar } from "antd";
import { Link } from 'react-router-dom';

import { useEffect } from "react";





function HomePage() {
    const contentStyle = {
        color: "#fff",
        justifyContent: "center",
        lineHeight: "160px",

        textAlign: "center",
        margin: "auto",
        borderRadius: "10px",
        marginTop: "25px",
    };

    useEffect(() => {
        window.scrollTo(0, 0);
      }, []);
    const { Meta } = Card;
    const navigate = useNavigate(); // Initialize useNavigate

    // Function to handle button click
    const handleFindOutMore = () => {
        navigate('/packages'); // Navigate to the RoomListPage
    };

    const FindOutMoreOffers = () => {
        navigate('/offers'); // Navigate to the RoomListPage
    };

    const FindOutMoreFeedbacks = () => {
        navigate('/feedbacks'); // Navigate to the RoomListPage
    };

    return (
        <div>
            <div className="center">
                <Carousel
                    autoplay
                    style={{ height: "669px", width: "1320px" }}
                >
                    <div>
                        <img
                            className="carousel_carouse"
                            src="https://i.imghippo.com/files/shT9628qNQ.jpg"
                            alt="corosal4"
                            style={{
                                ...contentStyle,
                                height: "669px",
                                width: "1320px",
                            }}
                        />
                    </div>
                    <div>
                        <img
                            className="carousel_carouse"
                            src="https://i.imghippo.com/files/vFUU7356VzM.jpg"
                            alt="corosal1"
                            style={{
                                ...contentStyle,
                                height: "669px",
                                width: "1320px",
                            }}
                        />
                    </div>
                    <div>
                        <img
                            className="carousel_carouse"
                            src="https://i.imghippo.com/files/sbP1459leA.jpg"
                            alt="corosal2"
                            style={{
                                ...contentStyle,
                                height: "669px",
                                width: "1320px",
                            }}
                        />
                    </div>
                    <div>
                        <img
                            className="carousel_carouse"
                            src="https://i.imghippo.com/files/Ndxr9776Cw.jpg"
                            alt="corosal3"
                            style={{
                                ...contentStyle,
                                height: "669px",
                                width: "1320px",
                            }}
                        />
                    </div>
                    <div>
                        <img
                            className="carousel_carouse"
                            src="https://i.imghippo.com/files/qOW1104EmA.jpg"
                            alt="corosal4"
                            style={{
                                ...contentStyle,
                                height: "669px",
                                width: "1320px",
                            }}
                        />
                    </div>
                </Carousel>
            </div>
            <div className="sg_home_page_txt_area">
    <h3>Your serene retreat, where luxury meets tranquility</h3>
    <h1>Unwind in elegance at Vila Taly</h1>
</div>
<div className="sg_home_page_paragraph_area">
    <div className="sg_home_page_paragraph_area_p1">
        <h>Nestled in a picturesque location, Vila Taly is your perfect getaway, blending modern luxury with timeless charm. Overlooking breathtaking landscapes and offering a peaceful ambiance, our hotel is an oasis of comfort for travelers seeking relaxation, adventure, or a special place to celebrate life’s moments. At Vila Taly, every stay is an experience of refined hospitality and personalized service.</h>
    </div>
    <div className="sg_home_page_paragraph_area_p2">
        <h>Whether you're here for a romantic escape, a business trip, or a family vacation, our dedicated team ensures a seamless and memorable experience. With exquisite accommodations, world-class dining, and unparalleled attention to detail, Vila Taly stands apart as the epitome of elegance and warmth. Welcome to your home away from home—where every moment is crafted for your utmost delight.</h>
    </div>
</div>

            <div className="sg_home_page_img_section_main">
                <div className="sg_home_page_image_1">
                    {/* image home */}
                </div>
            </div>
            <div className="sg_home_page_room_section_txt">
    <h3>Indulge in unparalleled luxury</h3>
    <h1>A HAVEN OF TRANQUILITY!</h1>
</div>
<div className="sg_home_page_room_section">
    <div className="sg_home_page_room_image_section">
    </div>
    <div className="sg_home_page_room_bag">
        <div className="sg_home_page_room_txt">
            <h2>EXQUISITE ROOM PACKAGES</h2>
            <h>Step into a world of elegance and comfort with our premium room packages at Vila Taly. Thoughtfully designed with luxurious furnishings and modern amenities, our rooms offer the perfect blend of relaxation and sophistication. Whether you're here for leisure or business, every stay promises a serene and memorable experience.</h>
            <Button danger style={{ color: '#27ae61', borderColor: '#27ae61', backgroundColor: 'transparent' }} onClick={handleFindOutMore}>FIND THE BEST ROOM PACKAGE</Button>
        </div>
    </div>
</div>

<div className="sg_home_page_food_section_main">
    <div className="sg_home_page_food_bg_image_section">
        <div className="sg_home_page_food_bg_section">
            <div className="sg_home_page_food_item_section_main">
                <div className="sg_home_page_food_txt">
                    <h3>Unforgettable stays with exclusive savings</h3>
                    <h2>SEASONAL & SPECIAL OFFERS!</h2>
                    <h>Discover unbeatable deals on our premium room packages! Whether it’s a seasonal retreat or a special celebration, Vila Taly offers exclusive discounts—fixed amounts or percentage-based savings—available for a limited time. Make the most of your getaway with luxurious stays at irresistible prices.</h>
                    <Button danger style={{ color: '#27ae61', borderColor: '#27ae61', backgroundColor: 'transparent', width: 140, marginLeft: 60, marginTop: 30 }}onClick={FindOutMoreOffers}>FIND MORE</Button>
                </div>
                <div className="sg_home_page_food_card_section">
                    <div className="sg_home_page_food_card_set">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div className="sg_home_page_online_oder_section">
    <div className="sg_home_page_online_oder_image">
    </div>
    <div className="sg_home_page_online_oder_btn_txt">
        <div className="sg_home_page_online_oder_txt">
            <h3>Your opinion matters</h3>
            <h2>SHARE & EXPLORE FEEDBACK</h2>
            <h>Tell us about your experience at Vila Taly! Leave a review and check out what other guests have to say. Your feedback helps us make every stay even better.</h>
        </div>
        <Button danger style={{ color: '#27ae61', borderColor: '#27ae61', backgroundColor: 'transparent', width: 140, marginLeft: 220, marginTop: 20 }}onClick={FindOutMoreFeedbacks}>GIVE FEEDBACK</Button>
    </div>
</div>

            
            <div className="sg_home_page_package_txt">
    <h1>OUR EXCEPTIONAL FACILITIES</h1>
</div>
<div className="sg_home_page_package_section">
    <div className="home_page_our_category_section1">
        <div className="home_page_category_card1">
            <h3>Swimming Pool</h3>
        </div>
        <div className="home_page_category_card2">
            <h3>Fitness Center</h3>
        </div>
        <div className="home_page_category_card3">
            <h3>Spa & Wellness</h3>
        </div>
    </div>
</div>
<div className="home_page_category_section2">
    <div className="home_page_category_card4">
        <h3>Fine Dining</h3>
    </div>
    <div className="home_page_category_card5">
        <h3>Private Lounge</h3>
    </div>
    <div className="home_page_category_card6">
        <h3>Luxury Suites</h3>
    </div>
</div>

        </div>
    );
}

export default HomePage;
