// Zimbabwe Provinces and Districts Data
export const zimbabweProvinces = {
  'Bulawayo': ['Bulawayo'],
  'Harare': ['Harare'],
  'Manicaland': ['Buhera', 'Chimanimani', 'Chipinge', 'Makoni', 'Mutare', 'Mutasa', 'Nyanga'],
  'Mashonaland Central': ['Bindura', 'Guruve', 'Mazowe', 'Mbire', 'Mount Darwin', 'Muzarabani', 'Mushumbi Pools', 'Rushinga', 'Shamva'],
  'Mashonaland East': ['Chikomba', 'Goromonzi', 'Marondera', 'Mudzi', 'Murehwa', 'Mutoko', 'Seke', 'Uzumba-Maramba-Pfungwe', 'Wedza'],
  'Mashonaland West': ['Chegutu', 'Hurungwe', 'Kadoma', 'Kariba', 'Makonde', 'Mhondoro-Ngezi', 'Zvimba', 'Sanyati', 'Chinhoyi'],
  'Masvingo': ['Bikita', 'Chiredzi', 'Chivi', 'Gutu', 'Mwenezi', 'Zaka', 'Masvingo', 'Mwenezi'],
  'Matabeleland North': ['Binga', 'Bubi', 'Hwange', 'Lupane', 'Nkayi', 'Tsholotsho', 'Umguza'],
  'Matabeleland South': ['Beitbridge', 'Bulilima', 'Gwanda', 'Insiza', 'Mangwe', 'Matobo', 'Umzingwane'],
  'Midlands': ['Chirumhanzu', 'Gokwe North', 'Gokwe South', 'Gweru', 'Kwekwe', 'Mberengwa', 'Shurugwi', 'Zvishavane']
};

export const getDistrictsForProvince = (province) => {
  return zimbabweProvinces[province] || [];
};

export const getAllProvinces = () => {
  return Object.keys(zimbabweProvinces);
};


