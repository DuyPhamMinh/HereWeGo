const Tour = require(__dirname + "/../model/Tour");

async function seedTours() {
  try {
    const existingTours = await Tour.countDocuments();
    
    if (existingTours > 0) {
      console.log(`Database already has ${existingTours} tours. Skipping seed.`);
      return;
    }

    const tours = [
      {
        title: "Khám phá Sapa - Nóc nhà Đông Dương",
        shortDescription: "Hành trình 3 ngày 2 đêm khám phá vẻ đẹp hùng vĩ của Sapa với ruộng bậc thang, đỉnh Fansipan và văn hóa dân tộc vùng cao.",
        description: "Tour Sapa 3 ngày 2 đêm sẽ đưa bạn đến với vùng đất mây mù quanh năm, nơi có những thửa ruộng bậc thang đẹp nhất Việt Nam. Bạn sẽ được chinh phục đỉnh Fansipan - nóc nhà Đông Dương, tham quan các bản làng dân tộc H'Mông, Dao, thưởng thức ẩm thực địa phương đặc sắc và tận hưởng không khí trong lành của núi rừng Tây Bắc.",
        destination: "Sapa, Lào Cai",
        duration: 3,
        durationUnit: "days",
        maxPersons: 20,
        price: 299,
        discountPrice: 249,
        image: "/static/img/packages-1.jpg",
        images: [
          "/static/img/packages-1.jpg",
          "/static/img/gallery-1.jpg",
          "/static/img/gallery-2.jpg",
          "/static/img/destination-1.jpg"
        ],
        category: "mountain",
        isActive: true,
        isFeatured: true,
        highlights: [
          "Chinh phục đỉnh Fansipan 3143m",
          "Tham quan ruộng bậc thang Tả Van",
          "Trải nghiệm văn hóa dân tộc H'Mông",
          "Thưởng thức ẩm thực địa phương"
        ],
        includes: [
          "Xe đưa đón Hà Nội - Sapa",
          "Khách sạn 3 sao tại trung tâm Sapa",
          "Bữa sáng tại khách sạn",
          "Vé cáp treo Fansipan",
          "Hướng dẫn viên địa phương",
          "Bảo hiểm du lịch"
        ],
        excludes: [
          "Vé máy bay",
          "Bữa trưa và tối",
          "Chi phí cá nhân",
          "Tip cho hướng dẫn viên"
        ],
        itinerary: [
          {
            day: 1,
            title: "Hà Nội - Sapa - Tham quan bản Cát Cát",
            description: "Khởi hành từ Hà Nội lúc 6h30, di chuyển đến Sapa. Đến Sapa vào buổi trưa, nhận phòng khách sạn và nghỉ ngơi. Buổi chiều tham quan bản Cát Cát - nơi sinh sống của người H'Mông đen, tìm hiểu văn hóa và nghề dệt thổ cẩm truyền thống.",
            places: ["Bản Cát Cát", "Thác Cát Cát", "Nhà cổ người H'Mông"],
            activities: ["Đi bộ tham quan bản làng", "Xem biểu diễn múa dân tộc", "Mua sắm đồ thủ công"],
            hotel: "Khách sạn Sapa Legend 3 sao"
          },
          {
            day: 2,
            title: "Chinh phục đỉnh Fansipan - Tham quan Tả Van",
            description: "Sáng sớm lên đỉnh Fansipan bằng cáp treo, ngắm toàn cảnh Sapa từ trên cao. Buổi chiều tham quan bản Tả Van - nơi có ruộng bậc thang đẹp nhất, gặp gỡ người dân tộc Giáy và tìm hiểu cuộc sống của họ.",
            places: ["Đỉnh Fansipan", "Bản Tả Van", "Ruộng bậc thang Tả Van", "Cầu Mây"],
            activities: ["Đi cáp treo Fansipan", "Trekking tham quan ruộng bậc thang", "Chụp ảnh check-in", "Thưởng thức cà phê trên đỉnh núi"],
            hotel: "Khách sạn Sapa Legend 3 sao"
          },
          {
            day: 3,
            title: "Sapa - Hàm Rồng - Hà Nội",
            description: "Buổi sáng tham quan núi Hàm Rồng, ngắm vườn hoa và tượng đài. Sau đó tự do mua sắm tại chợ Sapa. Khởi hành về Hà Nội lúc 14h, về đến Hà Nội khoảng 21h.",
            places: ["Núi Hàm Rồng", "Vườn hoa Hàm Rồng", "Chợ Sapa"],
            activities: ["Leo núi Hàm Rồng", "Mua sắm đặc sản", "Chụp ảnh lưu niệm"],
            hotel: ""
          }
        ],
        availableDates: [
          new Date("2025-01-15"),
          new Date("2025-01-22"),
          new Date("2025-02-05"),
          new Date("2025-02-12"),
          new Date("2025-02-19"),
          new Date("2025-03-05")
        ],
        rating: 4.8
      },
      {
        title: "Du lịch Hạ Long - Vịnh Di sản Thế giới",
        shortDescription: "Hành trình 2 ngày 1 đêm khám phá vịnh Hạ Long - một trong 7 kỳ quan thiên nhiên thế giới với hàng nghìn đảo đá vôi hùng vĩ.",
        description: "Vịnh Hạ Long là di sản thiên nhiên thế giới được UNESCO công nhận, nơi có hơn 1.600 hòn đảo đá vôi kỳ vĩ. Tour 2 ngày 1 đêm sẽ đưa bạn khám phá hang động đẹp nhất, tham quan làng chài nổi, tắm biển và thưởng thức hải sản tươi ngon. Bạn sẽ ngủ đêm trên tàu du lịch và ngắm bình minh tuyệt đẹp trên vịnh.",
        destination: "Hạ Long, Quảng Ninh",
        duration: 2,
        durationUnit: "days",
        maxPersons: 30,
        price: 189,
        discountPrice: 159,
        image: "/static/img/packages-2.jpg",
        images: [
          "/static/img/packages-2.jpg",
          "/static/img/gallery-3.jpg",
          "/static/img/gallery-4.jpg",
          "/static/img/destination-2.jpg"
        ],
        category: "beach",
        isActive: true,
        isFeatured: true,
        highlights: [
          "Tham quan hang Sửng Sốt - hang động đẹp nhất",
          "Chèo kayak khám phá hang Luồn",
          "Ngắm bình minh trên vịnh",
          "Thưởng thức hải sản tươi sống"
        ],
        includes: [
          "Tàu du lịch 3 sao",
          "Phòng ngủ trên tàu",
          "Tất cả bữa ăn",
          "Vé tham quan các điểm",
          "Chèo kayak",
          "Hướng dẫn viên",
          "Bảo hiểm du lịch"
        ],
        excludes: [
          "Vé máy bay",
          "Đồ uống có cồn",
          "Chi phí cá nhân",
          "Tip"
        ],
        itinerary: [
          {
            day: 1,
            title: "Hà Nội - Hạ Long - Tham quan vịnh",
            description: "Khởi hành từ Hà Nội lúc 8h, đến cảng Hạ Long lúc 12h. Lên tàu, thưởng thức bữa trưa trên tàu. Tham quan hang Sửng Sốt - hang động lớn và đẹp nhất vịnh Hạ Long. Tiếp tục đến đảo Titop để tắm biển và leo núi ngắm toàn cảnh vịnh. Buổi tối tham gia các hoạt động trên tàu như câu mực, karaoke.",
            places: ["Hang Sửng Sốt", "Đảo Titop", "Vịnh Hạ Long"],
            activities: ["Tham quan hang động", "Tắm biển", "Leo núi ngắm cảnh", "Câu mực đêm"],
            hotel: "Tàu du lịch Hạ Long 3 sao"
          },
          {
            day: 2,
            title: "Chèo kayak - Hang Luồn - Hà Nội",
            description: "Sáng sớm tập thể dục trên boong tàu, ngắm bình minh. Sau bữa sáng, chèo kayak khám phá hang Luồn và làng chài nổi. Trở về tàu, thưởng thức bữa trưa buffet. Trả phòng, về cảng và khởi hành về Hà Nội.",
            places: ["Hang Luồn", "Làng chài nổi", "Đảo Soi Sim"],
            activities: ["Chèo kayak", "Tham quan làng chài", "Tắm nắng", "Chụp ảnh"],
            hotel: ""
          }
        ],
        availableDates: [
          new Date("2025-01-10"),
          new Date("2025-01-17"),
          new Date("2025-01-24"),
          new Date("2025-01-31"),
          new Date("2025-02-07"),
          new Date("2025-02-14"),
          new Date("2025-02-21"),
          new Date("2025-02-28")
        ],
        rating: 4.9
      },
      {
        title: "Huế - Cố đô Di sản Văn hóa",
        shortDescription: "Tour 2 ngày 1 đêm khám phá Huế - kinh đô cổ của Việt Nam với đền đài, lăng tẩm và ẩm thực cung đình.",
        description: "Huế từng là kinh đô của triều Nguyễn, nơi lưu giữ nhiều di sản văn hóa quý giá. Tour sẽ đưa bạn tham quan Đại Nội, các lăng tẩm của vua, chùa Thiên Mụ cổ kính, đi thuyền trên sông Hương và thưởng thức ẩm thực cung đình đặc sắc. Bạn sẽ được trải nghiệm văn hóa truyền thống và lịch sử hào hùng của dân tộc.",
        destination: "Huế, Thừa Thiên Huế",
        duration: 2,
        durationUnit: "days",
        maxPersons: 25,
        price: 179,
        discountPrice: 149,
        image: "/static/img/packages-3.jpg",
        images: [
          "/static/img/packages-3.jpg",
          "/static/img/gallery-5.jpg",
          "/static/img/gallery-6.jpg",
          "/static/img/destination-3.jpg"
        ],
        category: "cultural",
        isActive: true,
        isFeatured: false,
        highlights: [
          "Tham quan Đại Nội - Hoàng thành Huế",
          "Tham quan lăng Khải Định, lăng Minh Mạng",
          "Chùa Thiên Mụ - biểu tượng Huế",
          "Thưởng thức ẩm thực cung đình"
        ],
        includes: [
          "Xe đưa đón",
          "Khách sạn 3 sao trung tâm",
          "Bữa sáng",
          "Vé tham quan tất cả điểm",
          "Hướng dẫn viên",
          "Bảo hiểm"
        ],
        excludes: [
          "Vé máy bay",
          "Bữa trưa, tối",
          "Chi phí cá nhân",
          "Tip"
        ],
        itinerary: [
          {
            day: 1,
            title: "Tham quan Đại Nội - Chùa Thiên Mụ",
            description: "Đến Huế, nhận phòng khách sạn. Tham quan Đại Nội - quần thể di tích cung đình được UNESCO công nhận. Buổi chiều tham quan chùa Thiên Mụ - ngôi chùa cổ nhất và đẹp nhất Huế, đi thuyền trên sông Hương nghe ca Huế.",
            places: ["Đại Nội", "Chùa Thiên Mụ", "Sông Hương", "Cầu Trường Tiền"],
            activities: ["Tham quan di tích", "Đi thuyền sông Hương", "Nghe ca Huế", "Chụp ảnh"],
            hotel: "Khách sạn Century Huế 3 sao"
          },
          {
            day: 2,
            title: "Lăng Khải Định - Lăng Minh Mạng - Về",
            description: "Buổi sáng tham quan lăng Khải Định - lăng tẩm độc đáo nhất với kiến trúc Đông Tây kết hợp. Tiếp tục đến lăng Minh Mạng - lăng tẩm đẹp nhất với kiến trúc hài hòa với thiên nhiên. Thưởng thức bữa trưa với món bún bò Huế nổi tiếng. Tự do mua sắm đặc sản trước khi về.",
            places: ["Lăng Khải Định", "Lăng Minh Mạng", "Chợ Đông Ba"],
            activities: ["Tham quan lăng tẩm", "Thưởng thức ẩm thực", "Mua sắm đặc sản"],
            hotel: ""
          }
        ],
        availableDates: [
          new Date("2025-01-12"),
          new Date("2025-01-19"),
          new Date("2025-01-26"),
          new Date("2025-02-02"),
          new Date("2025-02-09"),
          new Date("2025-02-16")
        ],
        rating: 4.7
      },
      {
        title: "Phú Quốc - Đảo Ngọc Paradise",
        shortDescription: "Tour 4 ngày 3 đêm nghỉ dưỡng tại Phú Quốc với bãi biển đẹp nhất, resort cao cấp và các hoạt động giải trí đa dạng.",
        description: "Phú Quốc là hòn đảo lớn nhất Việt Nam, nơi có những bãi biển đẹp nhất thế giới với cát trắng, nước trong xanh. Tour 4 ngày 3 đêm sẽ đưa bạn đến với thiên đường nghỉ dưỡng, tham quan các điểm du lịch nổi tiếng như Vinpearl Safari, làng chài Hàm Ninh, suối Tranh và thưởng thức hải sản tươi ngon. Bạn sẽ được nghỉ tại resort 4 sao với view biển tuyệt đẹp.",
        destination: "Phú Quốc, Kiên Giang",
        duration: 4,
        durationUnit: "days",
        maxPersons: 15,
        price: 599,
        discountPrice: 499,
        image: "/static/img/packages-4.jpg",
        images: [
          "/static/img/packages-4.jpg",
          "/static/img/gallery-7.jpg",
          "/static/img/gallery-8.jpg",
          "/static/img/destination-4.jpg",
          "/static/img/gallery-9.jpg"
        ],
        category: "beach",
        isActive: true,
        isFeatured: true,
        highlights: [
          "Nghỉ dưỡng resort 4 sao view biển",
          "Bãi Sao - bãi biển đẹp nhất Phú Quốc",
          "Vinpearl Safari - công viên động vật hoang dã",
          "Lặn ngắm san hô",
          "Thưởng thức hải sản tươi sống"
        ],
        includes: [
          "Vé máy bay khứ hồi",
          "Resort 4 sao view biển",
          "Bữa sáng buffet",
          "Vé tham quan Vinpearl Safari",
          "Tour lặn ngắm san hô",
          "Xe đưa đón sân bay",
          "Hướng dẫn viên",
          "Bảo hiểm"
        ],
        excludes: [
          "Bữa trưa, tối",
          "Đồ uống",
          "Chi phí cá nhân",
          "Tip"
        ],
        itinerary: [
          {
            day: 1,
            title: "Đến Phú Quốc - Nhận phòng resort",
            description: "Đón sân bay, đưa về resort nhận phòng. Nghỉ ngơi, tắm biển tại bãi biển của resort. Buổi tối tự do tham quan chợ đêm Dinh Cậu, thưởng thức hải sản.",
            places: ["Resort Phú Quốc", "Bãi biển resort", "Chợ đêm Dinh Cậu"],
            activities: ["Nhận phòng", "Tắm biển", "Tham quan chợ đêm", "Thưởng thức hải sản"],
            hotel: "Resort Phú Quốc 4 sao"
          },
          {
            day: 2,
            title: "Bãi Sao - Làng chài Hàm Ninh",
            description: "Buổi sáng tham quan Bãi Sao - bãi biển đẹp nhất với cát trắng mịn, nước trong xanh. Tiếp tục đến làng chài Hàm Ninh tìm hiểu cuộc sống ngư dân, thưởng thức hải sản tươi sống. Buổi chiều tự do tắm biển, chụp ảnh.",
            places: ["Bãi Sao", "Làng chài Hàm Ninh", "Nhà thùng nước mắm"],
            activities: ["Tắm biển", "Chụp ảnh", "Tham quan làng chài", "Thưởng thức hải sản"],
            hotel: "Resort Phú Quốc 4 sao"
          },
          {
            day: 3,
            title: "Vinpearl Safari - Lặn ngắm san hô",
            description: "Buổi sáng tham quan Vinpearl Safari - công viên động vật hoang dã lớn nhất Việt Nam. Buổi chiều tham gia tour lặn ngắm san hô tại các đảo phía Nam, tắm biển và thư giãn.",
            places: ["Vinpearl Safari", "Đảo An Thới", "Rạn san hô"],
            activities: ["Tham quan safari", "Lặn ngắm san hô", "Tắm biển", "Chụp ảnh dưới nước"],
            hotel: "Resort Phú Quốc 4 sao"
          },
          {
            day: 4,
            title: "Suối Tranh - Về",
            description: "Buổi sáng tham quan suối Tranh - thác nước đẹp giữa rừng nguyên sinh. Mua sắm đặc sản Phú Quốc như nước mắm, hồ tiêu, rượu sim. Trả phòng, đưa ra sân bay về.",
            places: ["Suối Tranh", "Chợ đặc sản", "Nhà máy nước mắm"],
            activities: ["Tham quan suối", "Trekking", "Mua sắm đặc sản"],
            hotel: ""
          }
        ],
        availableDates: [
          new Date("2025-01-20"),
          new Date("2025-01-27"),
          new Date("2025-02-03"),
          new Date("2025-02-10"),
          new Date("2025-02-17"),
          new Date("2025-02-24"),
          new Date("2025-03-03"),
          new Date("2025-03-10")
        ],
        rating: 4.9
      },
      {
        title: "Đà Lạt - Thành phố Ngàn Hoa",
        shortDescription: "Tour 3 ngày 2 đêm khám phá Đà Lạt - thành phố mộng mơ với khí hậu mát mẻ, hoa và cảnh đẹp lãng mạn.",
        description: "Đà Lạt được mệnh danh là thành phố ngàn hoa với khí hậu mát mẻ quanh năm. Tour sẽ đưa bạn tham quan các điểm du lịch nổi tiếng như thung lũng Tình Yêu, hồ Xuân Hương, chùa Linh Phước, đồi chè Cầu Đất và thưởng thức đặc sản địa phương. Bạn sẽ được trải nghiệm không khí trong lành và cảnh đẹp lãng mạn của thành phố sương mù.",
        destination: "Đà Lạt, Lâm Đồng",
        duration: 3,
        durationUnit: "days",
        maxPersons: 20,
        price: 229,
        discountPrice: 199,
        image: "/static/img/packages-5.jpg",
        images: [
          "/static/img/packages-5.jpg",
          "/static/img/gallery-10.jpg",
          "/static/img/gallery-11.jpg",
          "/static/img/destination-5.jpg"
        ],
        category: "nature",
        isActive: true,
        isFeatured: false,
        highlights: [
          "Thung lũng Tình Yêu lãng mạn",
          "Chùa Linh Phước - chùa ve chai độc đáo",
          "Đồi chè Cầu Đất",
          "Thưởng thức dâu tây, atiso",
          "Chụp ảnh check-in sống ảo"
        ],
        includes: [
          "Xe đưa đón",
          "Khách sạn 3 sao trung tâm",
          "Bữa sáng",
          "Vé tham quan",
          "Hướng dẫn viên",
          "Bảo hiểm"
        ],
        excludes: [
          "Vé máy bay",
          "Bữa trưa, tối",
          "Chi phí cá nhân",
          "Tip"
        ],
        itinerary: [
          {
            day: 1,
            title: "Đến Đà Lạt - Tham quan trung tâm",
            description: "Đến Đà Lạt, nhận phòng khách sạn. Tham quan hồ Xuân Hương - trái tim của thành phố, chợ Đà Lạt mua sắm đặc sản. Buổi chiều tham quan Dinh Bảo Đại - nơi ở của vua cuối cùng, chùa Linh Phước với kiến trúc độc đáo từ ve chai.",
            places: ["Hồ Xuân Hương", "Chợ Đà Lạt", "Dinh Bảo Đại", "Chùa Linh Phước"],
            activities: ["Tham quan di tích", "Mua sắm", "Chụp ảnh", "Thưởng thức đặc sản"],
            hotel: "Khách sạn Đà Lạt 3 sao"
          },
          {
            day: 2,
            title: "Thung lũng Tình Yêu - Đồi chè Cầu Đất",
            description: "Buổi sáng tham quan thung lũng Tình Yêu - điểm đến lãng mạn nhất Đà Lạt với hoa và cảnh đẹp. Tiếp tục đến đồi chè Cầu Đất - đồn điền chè lớn nhất, tham quan và thưởng thức trà. Buổi chiều tham quan làng hoa Vạn Thành, chụp ảnh với hoa.",
            places: ["Thung lũng Tình Yêu", "Đồi chè Cầu Đất", "Làng hoa Vạn Thành"],
            activities: ["Tham quan", "Chụp ảnh", "Thưởng thức trà", "Mua hoa"],
            hotel: "Khách sạn Đà Lạt 3 sao"
          },
          {
            day: 3,
            title: "Ga Đà Lạt - Vườn hoa thành phố - Về",
            description: "Buổi sáng tham quan ga Đà Lạt cổ - nhà ga đẹp nhất Đông Dương, đi tàu lửa đến Trại Mát. Tham quan vườn hoa thành phố với hàng ngàn loài hoa. Mua sắm đặc sản như dâu tây, atiso, mứt trái cây. Trả phòng, về.",
            places: ["Ga Đà Lạt", "Trại Mát", "Vườn hoa thành phố", "Chợ đặc sản"],
            activities: ["Đi tàu lửa", "Tham quan", "Mua sắm đặc sản"],
            hotel: ""
          }
        ],
        availableDates: [
          new Date("2025-01-18"),
          new Date("2025-01-25"),
          new Date("2025-02-01"),
          new Date("2025-02-08"),
          new Date("2025-02-15"),
          new Date("2025-02-22")
        ],
        rating: 4.6
      },
      {
        title: "Hội An - Phố cổ Di sản",
        shortDescription: "Tour 2 ngày 1 đêm khám phá Hội An - phố cổ đẹp nhất Việt Nam với kiến trúc cổ, đèn lồng và ẩm thực đặc sắc.",
        description: "Hội An là phố cổ được UNESCO công nhận là di sản văn hóa thế giới, nơi lưu giữ kiến trúc cổ độc đáo từ thế kỷ 16-18. Tour sẽ đưa bạn tham quan các ngôi nhà cổ, chùa Cầu Nhật Bản, làng gốm Thanh Hà, làng rau Trà Quế và thưởng thức các món ăn địa phương nổi tiếng. Buổi tối bạn sẽ được ngắm phố cổ lung linh với hàng ngàn đèn lồng.",
        destination: "Hội An, Quảng Nam",
        duration: 2,
        durationUnit: "days",
        maxPersons: 25,
        price: 169,
        discountPrice: 139,
        image: "/static/img/packages-6.jpg",
        images: [
          "/static/img/packages-6.jpg",
          "/static/img/gallery-12.jpg",
          "/static/img/destination-6.jpg",
          "/static/img/destination-7.jpg"
        ],
        category: "cultural",
        isActive: true,
        isFeatured: true,
        highlights: [
          "Tham quan phố cổ Hội An",
          "Chùa Cầu Nhật Bản - biểu tượng Hội An",
          "Làng gốm Thanh Hà",
          "Làng rau Trà Quế",
          "Ngắm đèn lồng buổi tối",
          "Thưởng thức cao lầu, bánh mì Phượng"
        ],
        includes: [
          "Xe đưa đón",
          "Khách sạn 3 sao phố cổ",
          "Bữa sáng",
          "Vé tham quan",
          "Hướng dẫn viên",
          "Bảo hiểm"
        ],
        excludes: [
          "Vé máy bay",
          "Bữa trưa, tối",
          "Chi phí cá nhân",
          "Tip"
        ],
        itinerary: [
          {
            day: 1,
            title: "Đến Hội An - Tham quan phố cổ",
            description: "Đến Hội An, nhận phòng khách sạn. Tham quan phố cổ với các ngôi nhà cổ hơn 200 năm tuổi, chùa Cầu Nhật Bản - biểu tượng của Hội An. Tham quan hội quán Phúc Kiến, nhà cổ Tấn Ký. Buổi tối đi bộ phố cổ, ngắm đèn lồng và thưởng thức ẩm thực đường phố.",
            places: ["Phố cổ Hội An", "Chùa Cầu Nhật Bản", "Hội quán Phúc Kiến", "Nhà cổ Tấn Ký"],
            activities: ["Tham quan di tích", "Đi bộ phố cổ", "Ngắm đèn lồng", "Thưởng thức ẩm thực"],
            hotel: "Khách sạn Hội An 3 sao"
          },
          {
            day: 2,
            title: "Làng gốm Thanh Hà - Làng rau Trà Quế - Về",
            description: "Buổi sáng tham quan làng gốm Thanh Hà - làng nghề truyền thống hơn 500 năm, tự tay làm gốm. Tiếp tục đến làng rau Trà Quế - nơi trồng rau sạch nổi tiếng, tham quan và thưởng thức bữa trưa với rau tươi. Mua sắm đặc sản như bánh đậu xanh, mứt, về.",
            places: ["Làng gốm Thanh Hà", "Làng rau Trà Quế", "Chợ Hội An"],
            activities: ["Làm gốm", "Tham quan làng nghề", "Thưởng thức ẩm thực", "Mua sắm"],
            hotel: ""
          }
        ],
        availableDates: [
          new Date("2025-01-14"),
          new Date("2025-01-21"),
          new Date("2025-01-28"),
          new Date("2025-02-04"),
          new Date("2025-02-11"),
          new Date("2025-02-18"),
          new Date("2025-02-25")
        ],
        rating: 4.8
      }
    ];

    await Tour.insertMany(tours);
    console.log(`✅ Successfully seeded ${tours.length} tours to database!`);
    
  } catch (error) {
    console.error("Error seeding tours:", error);
    throw error;
  }
}

module.exports = { seedTours };



