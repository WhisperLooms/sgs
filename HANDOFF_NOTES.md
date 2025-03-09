# SGS Headmasters Chat Application - Handoff Notes

## Important Configuration Issues

### 1. Environment Variables
The application requires valid API keys:
- **Supabase Configuration**: Update `.env.local` with valid Supabase URL and keys
  - Required fields: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- **OpenAI API Key**: Required for LLM chat functionality
- **ElevenLabs API Key**: Required for voice synthesis

### 2. Development Server
- Default port: 3000 (use 3005 if occupied)
- Check file permissions for .next/trace
- Multiple instances may cause port conflicts

### 3. Image Assets
- Verify paths in public/images/headmasters/
- Ensure placeholder generation script has run
- Check for 404 errors on headmaster images

### 4. API Functions
- Fallback implementations available when API keys are missing
- Updated headmaster introduction API
- Enhanced chat response handling

## Next Development Tasks
1. Enhance headmaster personas with specific knowledge
2. Update Supabase integration
3. Implement remaining features from Stage 3

## Repository Structure
- `/components`: React components including HeadmasterChat
- `/pages/api`: Backend API endpoints
- `/public`: Static assets (images, videos)
- `/data`: JSON data files
- `/scripts`: Utility scripts for setup and maintenance

## Known Issues
1. Video sizing in chat interface
2. Port conflicts with development server
3. Image 404 errors requiring placeholder generation
4. API authentication errors with placeholder keys