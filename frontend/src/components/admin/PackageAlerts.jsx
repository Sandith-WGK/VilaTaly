import React, { useMemo } from 'react';
import { Alert, Typography, List } from 'antd';

const { Title, Text } = Typography;

// Custom trending up icon as SVG
const TrendingUpIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    width="1em" 
    height="1em" 
    fill="currentColor"
    style={{ 
      verticalAlign: 'middle',
      marginRight: '8px'
    }}
  >
    <path d="M23 6l-9.5 9.5-5-5C8.5 10.5 6 13 3 16.5h2.5l4-4 5 5 10-10z" />
  </svg>
);

const PackageAlerts = ({ packages, bookingData }) => {
  const popularPackages = useMemo(() => {
    const bookingCount = {};
    
    bookingData.forEach(booking => {
      const packageId = booking.packageId.toString();
      bookingCount[packageId] = (bookingCount[packageId] || 0) + 1;
    });
    
    return packages.filter(pkg => 
      bookingCount[pkg._id.toString()] >= 3
    ).map(pkg => ({
      ...pkg,
      bookingCount: bookingCount[pkg._id.toString()]
    }));
  }, [packages, bookingData]);

  if (popularPackages.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {popularPackages.map(pkg => (
        <Alert
          key={pkg._id}
          type="info"
          icon={<TrendingUpIcon />}
          showIcon
          message={
            <Title level={4} style={{ margin: 0 }}>
              Popular Package Alert: {pkg.packageName}
            </Title>
          }
          description={
            <>
              <Text>
                This package has been booked {pkg.bookingCount} times. Consider:
              </Text>
              <List
                style={{ marginTop: 10 }}
                size="small"
                dataSource={[
                  'Creating similar packages to meet demand',
                  'Offering special rates for group bookings',
                  'Highlighting this package in promotions'
                ]}
                renderItem={item => (
                  <List.Item>
                    <Text>{item}</Text>
                  </List.Item>
                )}
              />
            </>
          }
          style={{
            backgroundColor: '#e6f7ff',
            border: '1px solid #91d5ff'
          }}
        />
      ))}
    </div>
  );
};

export default PackageAlerts;