<div align="center">
    <div align="center">
    <img src="public/assets/ar-light.svg" width="200" alt="arenas-logo" />
    </div>
    <h1 align="center">ArenasAI</h1>
    <p align="center">Open Source AI-Powered Data Scientist</p>
</div>

[![discord][discord]][discordurl]

## Table of Contents

- [About the Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
- [Contributing](#contributing)
- [Get in Touch](#get-in-touch)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### About the Project

This app aims to solve several pain points in the data science industry, and hopefully bring about a significant change in how we work with data in the future. currently, we are focusing on a smaller problem: realtime changes in excel and google sheets, and performing data cleaning. 

Made by [Mubashir Osmani](https://github.com/mubashir1osmani)


### Tech Stack

- [![nextjs][nextjs]][nextjs-url]
- [![tailwindcss][tailwindcss]][tailwindcss-url]
- [![typescript][typescript]][typescripturl]

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

1. Fork the repo

2. Clone it
```sh
    git clone https://github.com/<YOUR_USERNAME>/arenas.git
```

3. Install dependencies
```sh
bun install    # or npm install / yarn install
```

### Environment Variables
This project relies on external services (Supabase, Stripe, Beehiiv, PostHog, E2B sandbox, and the Arenas AI backend). Copy the example file and configure your credentials:
```sh
cp .env.example .env.local
# Edit .env.local to add your keys and URLs
```

### Run the Development Server
```sh
bun dev        # or npm run dev / yarn dev
```


### Contributing

- Everyone is welcome to contribute to this product. yes, everyone. even if you no experience in coding, you can get started with any AI-powered code editor liek aider, Cursor, PearAI and so on. 

- If you have an idea in mind or need to report a bug, feel free to open an [issue](https://github.com/ArenasAI/arenas/issues).

- We actively welcome pull requests

1. Fork the repo and create a new branch 
  ```sh
  git checkout -b my-branch
  ```
2. If you've added code that should be tested, add tests.
3. Make sure you include what changes you've made in the PR template


### Get in touch
you can reach me on:
email: witharenas@gmail.com
discord: @deloreann1



[typescript]: https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white
[typescripturl]: https://www.typescriptlang.org/
[vercel]: https://img.shields.io/badge/Vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white
[vercel-url]: https://vercel.com/
[nextjs]: https://img.shields.io/badge/Next.js-%23000000.svg?style=for-the-badge&logo=next.js&logoColor=white
[nextjs-url]: https://nextjs.org/
[tailwindcss]: https://img.shields.io/badge/Tailwind_CSS-%231a202c.svg?style=for-the-badge&logo=tailwind-css&logoColor=white
[tailwindcss-url]: https://tailwindcss.com/

[python]: https://img.shields.io/badge/python-%233776AB.svg?style=for-the-badge&logo=python&logoColor=white
[r]: https://img.shields.io/badge/R-%23276DC2.svg?style=for-the-badge&logo=r&logoColor=white
[julia]: https://img.shields.io/badge/julia-%235A0D8E.svg?style=for-the-badge&logo=julia&logoColor=white
[supabase]: https://img.shields.io/badge/Supabase-%233ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white
[supabaseurl]: https://supabase.com
[discord]: https://img.shields.io/badge/discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white
[discordurl]: https://discord.gg/spZ5yucbnn 
