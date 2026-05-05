# MC-Vault Roadmap

### Core Tools (Priority: High)
- [x] **Color Code Converter**: Basic conversion logic for `&` and `§` codes.
- [x] **Server Status Ping**: 
    - Implement `mc-proto` or `mctools` integration in `src/api/server.js`.
    - Create a React component to display real-time player counts and MOTDs.
- [x] **Skin Viewer**: 
    - Integrate a 3D skin rendering library (e.g., `skinview3d`).
    - Build input field for Minecraft username/UUID.

### Backend & Infrastructure
- [x] **API Hardening**: Add validation to `/api/ping` to prevent SSRF and request abuse.
- [ ] **Deployment**: Configure build pipeline for Vercel (Frontend) and DigitalOcean (Backend).

### UI/UX Polish
- [x] **Theming**: Add more "Minecraft-inspired" accents (pixel fonts, grass-block border styles).
- [x] **Responsive Design**: Ensure mobile-first layouts for all utility tools.

### Future Expansions
- [ ] **Enchantment Calculator**: Tool to calculate leveling/costs.
- [ ] **Crafting Recipe Guide**: Searchable database of item recipes.
- [ ] **Server History**: Database/localStorage to keep track of recently pinged servers.
