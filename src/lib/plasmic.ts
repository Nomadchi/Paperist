'use client'

import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "be6XhdzAdwspnnekpAUQj5",  // ID of a project you are using
      token: "AuLXYz3dHAa91K6MJ9OJKul8Wb1QqjAqKMz3xhNQkzKzI5OvcIaDr8ZRyDQDKwzVfVGRKHVk7A78nGg"  // API token for that project
    }
  ],
  // Fetches the latest revisions, whether or not they were unpublished!
  // Disable for production to ensure you render only published changes.
  preview: true,
})