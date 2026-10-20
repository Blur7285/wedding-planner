/* Public configuration (safe to publish: OAuth client IDs, browser API keys restricted by referrer, project numbers and
   Drive file IDs are not secrets; access to the data is granted only by sharing it in Google Drive).
   WEB_CLIENT_ID:  "Wedding Planner Web" OAuth client (origin https://blur7285.github.io, redirect https://blur7285.github.io/wedding-planner/).
                   Empty = each device pastes it once in the Sign-in panel.
   PICKER_API_KEY: browser API key (Google Picker API, HTTP-referrer restricted). Empty = pasted once in the Connect panel.
   PROJECT_NUMBER: Google Cloud project number (the Picker grants the chosen file to this app).
   SYNC_FOLDER_ID / SYNC_FILE_ID: the shared "Wedding Planner Sync" folder and its data file. */
window.WP_CONFIG = {
  WEB_CLIENT_ID: '',
  PICKER_API_KEY: '',
  PROJECT_NUMBER: '749897568298',
  SYNC_FOLDER_ID: '1IgPWFlCCccFFK82Q9z_ru2IUD_pe6rtn',
  SYNC_FILE_ID: '172BSAeagqLHFjhumKZTOKtoLfrYwCZLk'
};
