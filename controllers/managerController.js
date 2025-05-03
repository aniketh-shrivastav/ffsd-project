exports.getProfileData = async (req, res) => {
  try {
      const userId = req.params.id;
      let user = await Customer.findById(userId).populate('userId');
      let role = 'Customer', details = '';

      if (!user) {
          user = await Seller.findById(userId).populate('sellerId');
          role = 'Seller';
      }
      if (!user) {
          user = await ServiceProvider.findById(userId);
          role = 'Service Provider';
      }

      if (!user) return res.status(404).json({ error: 'User not found' });

      const profilePicture = user.profilePicture || user.userId?.profilePicture || user.sellerId?.profilePicture || 'https://via.placeholder.com/80';
      const name = user.name || user.userId?.name || user.sellerId?.name;
      const email = user.email || user.userId?.email || user.sellerId?.email;
      const phone = user.phone || user.userId?.phone || user.sellerId?.phone;

      if (role === 'Customer') {
          details = `
              <p><strong>Address:</strong> ${user.address || 'N/A'}</p>
              <p><strong>District:</strong> ${user.district || 'N/A'}</p>
              <p><strong>Car Model:</strong> ${user.carModel || 'N/A'}</p>
          `;
      } else if (role === 'Seller') {
          details = `
              <p><strong>Owner:</strong> ${user.ownerName || 'N/A'}</p>
              <p><strong>Store Address:</strong> ${user.address || 'N/A'}</p>
          `;
      } else if (role === 'Service Provider') {
          const services = user.servicesOffered?.map(s => `<li>${s.name} - ₹${s.cost}</li>`).join('') || '';
          details = `
              <p><strong>District:</strong> ${user.district || 'N/A'}</p>
              <h4>Services:</h4><ul>${services}</ul>
          `;
      }

      res.json({
          profilePicture,
          name,
          email,
          phone,
          role,
          extraDetails: details
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};