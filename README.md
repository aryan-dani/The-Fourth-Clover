# 🍀 The Fourth Clover

> A modern, minimalist blogging platform built for Gen-Z writers and thinkers.

![Next.js](https://img.shields.io/badge/Next.js-13.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

- **🎨 Modern Design**: Clean, minimalist interface inspired by Medium with a circular, monochrome aesthetic
- **✍️ Rich Writing Experience**: Intuitive editor with real-time auto-save and character counters
- **📸 Image Upload**: Seamless image upload and management with Supabase Storage
- **🔐 Authentication**: Secure Google OAuth integration with Supabase Auth
- **📱 Responsive**: Beautiful design that works perfectly on all devices
- **🚀 Performance**: Built with Next.js 13+ for optimal speed and SEO
- **💾 Real-time**: Live auto-save functionality to never lose your work
- **🎯 User-Friendly**: Intuitive dashboard for managing drafts and published posts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/the-fourth-clover.git
   cd the-fourth-clover
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**

   - Go to your Supabase dashboard
   - Run the SQL from `database-setup.sql` in the SQL Editor
   - Create a storage bucket named `post-images` and make it public

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Storage**: Supabase Storage for images
- **UI Components**: Radix UI + shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Typography**: Charter (content), Playfair Display (headings)

## 📁 Project Structure

```
├── app/                 # Next.js 13+ app directory
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # User dashboard
│   ├── explore/        # Discover posts
│   ├── post/           # Individual post pages
│   ├── profile/        # User profiles
│   └── write/          # Post editor
├── components/         # Reusable components
│   ├── auth/          # Auth-related components
│   ├── layout/        # Layout components
│   └── ui/            # UI components (shadcn/ui)
├── lib/               # Utilities and configurations
│   ├── auth-context.tsx
│   ├── supabase.ts
│   └── utils.ts
└── hooks/             # Custom React hooks
```

## 🎨 Design Philosophy

**The Fourth Clover** embraces a Gen-Z aesthetic with:

- **Minimalist Interface**: Clean, distraction-free writing environment
- **Circular Elements**: Rounded buttons, avatars, and cards for modern appeal
- **Monochrome Palette**: Elegant black, white, and gray color scheme
- **Beautiful Typography**: Charter font for exceptional reading experience
- **Subtle Animations**: Smooth, non-intrusive motion design
- **Mobile-First**: Responsive design that looks great everywhere

## 🔧 Configuration

### Environment Variables

| Variable                        | Description                 | Required |
| ------------------------------- | --------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL   | ✅       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅       |

### Database Schema

The platform uses these main tables:

- `posts` - Blog posts with metadata
- `profiles` - User profiles
- `comments` - Post comments (future feature)
- `likes` - Post likes (future feature)

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in the Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy your app

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Supabase** for the amazing backend-as-a-service
- **Medium.com** for design inspiration
- **Charter** and **Playfair Display** for the elegant typography

---

**Built with ❤️ for the next generation of writers and storytellers.**
