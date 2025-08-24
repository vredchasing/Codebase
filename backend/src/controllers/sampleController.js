import kiraService from '../services/kiraService.js';

export const getSampleData = async (req, res) => {
  try {
    const response = await kiraService.post('', { prompt: 'Hello' });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data from KiraService' });
  }
};
