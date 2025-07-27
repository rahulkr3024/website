# Quicky Analyzer Frontend

A modern React frontend for the Content Analyzer application that provides AI-powered content analysis capabilities.

## Features

- **Multiple Content Types**: Analyze text, PDFs, YouTube videos, and blog posts
- **AI-Powered Analysis**: Generate key points, summaries, mind maps, and presentations
- **Modern UI**: Clean, responsive design with Material-UI components
- **File Upload**: Drag-and-drop file upload with progress indicators
- **Download Options**: Export results as PDF, TXT, DOCX, or interactive formats
- **Real-time Analysis**: Live analysis with progress feedback
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Backend API running on http://localhost:3000

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_APP_NAME=Quicky Analyzer
```

5. Start the development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3001`.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   ├── ContentUpload.js
│   │   ├── AnalysisOptions.js
│   │   └── AnalysisResults.js
│   ├── services/
│   │   └── apiService.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Components

### Header
- Application branding and navigation
- Responsive design with mobile menu

### ContentUpload
- File upload with drag-and-drop support
- Text input for direct content entry
- URL input for video and blog analysis
- Progress indicators and error handling

### AnalysisOptions
- Toggle between different analysis types
- Dynamic UI based on selected analysis type

### AnalysisResults
- Display analysis results in organized sections
- Download options for different formats
- Interactive elements for detailed exploration

## API Integration

The frontend communicates with the backend API through the `apiService` module:

- **Text Analysis**: `/api/text/analyze`
- **PDF Analysis**: `/api/pdf/analyze`
- **Video Analysis**: `/api/video/analyze`
- **Blog Analysis**: `/api/blog/analyze`
- **Downloads**: `/api/download/generate`
- **Mind Maps**: `/api/mindmap/generate`
- **Presentations**: `/api/presentation/generate`

## Styling

The application uses:
- CSS3 with custom properties
- Flexbox and Grid layouts
- Responsive design principles
- Modern color schemes and typography
- Smooth animations and transitions

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Adding New Features

1. Create new components in `src/components/`
2. Add API endpoints in `src/services/apiService.js`
3. Update routing if needed
4. Add corresponding styles

### Testing

```bash
npm test
```

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Deployment

### Environment Variables

Set the following environment variables for production:

- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_APP_NAME` - Application name

### Build and Deploy

1. Build the application:
```bash
npm run build
```

2. Deploy the `build/` folder to your web server or hosting platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.