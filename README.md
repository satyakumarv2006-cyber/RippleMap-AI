# 🌍 RippleMap AI

### Interactive Issue Reporting, Recurrence Detection & Hotspot Visualization

RippleMap AI is a web-based application designed to help users report location-based issues, identify recurring problems, and visualize issue hotspots on an interactive map.

## 🚀 Features

- **Interactive Map:** Explore reported issues using a map interface.
- **Issue Reporting:** Submit reports with descriptions, locations, and photos.
- **Location Support:** Use GPS or select a location manually.
- **Photo Handling:** Capture or upload images for reports.
- **Recurrence Detection:** Identify repeated issues reported near the same location.
- **Hotspot Detection:** Group nearby reports to highlight potential problem areas.
- **Priority Classification:** Categorize hotspots by priority.
- **Dashboard Statistics:** View issue counts and status summaries.
- **Admin Dashboard:** Review reports and update their statuses.
- **Search and Filtering:** Find reports and organize them by relevant criteria.
- **Local Data Storage:** Save report data in the browser using `localStorage`.

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- Leaflet.js for interactive maps
- Browser Geolocation API
- Browser `localStorage`

## 📂 Project Structure

```text
RippleMap-AI/
├── index.html
├── report.html
├── admin.html
├── issue-details.html
├── css/
│   └── style.css
└── js/
    ├── admin.js
    ├── app.js
    ├── camera.js
    ├── dashboard.js
    ├── hotspot-panel.js
    ├── hotspots.js
    ├── map.js
    ├── recurrence.js
    ├── reports.js
    ├── sample-data.js
    └── storage.js
```

## ▶️ How to Run

1. Clone this repository:

   ```bash
   git clone https://github.com/satyakumarv2006-cyber/RippleMap-AI.git
   ```

2. Open the project folder in VS Code.
3. Run the application using a local development server, such as the **Live Server** extension.
4. Open `index.html` through the local server in your browser.

> Note: Running through a local server is recommended for map and browser geolocation features.

## 💾 Data Storage

The current version uses browser `localStorage` for report persistence. Data is stored separately in each browser and website origin. Reports are not automatically synchronized between different users or devices.

## 🔮 Future Enhancements

- Cloud database integration for shared reports.
- User authentication and role-based admin access.
- Real-time issue updates.
- Advanced analytics and heatmap visualizations.
- Deployment as a publicly accessible web application.

## 🎯 Project Goal

RippleMap AI aims to make location-based issue reporting more organized and help users identify recurring problems and areas that may need attention.

## 👨‍💻 Developer

**Satya Kumar V**

GitHub: [@satyakumarv2006-cyber](https://github.com/satyakumarv2006-cyber)

## 📜 License

No license has been specified yet.
