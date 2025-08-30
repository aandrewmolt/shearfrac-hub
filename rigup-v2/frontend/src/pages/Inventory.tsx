
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Inventory = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the comprehensive equipment inventory page
    navigate('/inventory/equipment', { replace: true });
  }, [navigate]);

  return null;
};

export default Inventory;
