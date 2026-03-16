import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Static curated data for the resource database
// In production these would come from the DB; we seed them inline for now.

export const VC_FIRMS_DATA = [
  { id: 1, name: "Sequoia Capital", description: "One of the most successful VC firms globally, backing companies like Apple, Google, WhatsApp, and Airbnb.", website: "https://sequoiacap.com", hqCity: "Menlo Park", hqCountry: "USA", regions: ["North America", "Europe", "Asia", "India"], stages: ["seed", "series-a", "series-b", "growth"], sectors: ["saas", "fintech", "consumer", "healthcare", "enterprise"], checkSizeMin: 0.1, checkSizeMax: 100, aum: 85000, notablePortfolio: ["Apple", "Google", "WhatsApp", "Airbnb", "Stripe"], applyUrl: "https://sequoiacap.com/companies/", isActive: true },
  { id: 2, name: "Andreessen Horowitz (a16z)", description: "Leading Silicon Valley VC firm investing across consumer, enterprise, crypto, and bio.", website: "https://a16z.com", hqCity: "Menlo Park", hqCountry: "USA", regions: ["North America", "Europe"], stages: ["seed", "series-a", "series-b", "growth"], sectors: ["crypto", "saas", "fintech", "biotech", "consumer"], checkSizeMin: 0.5, checkSizeMax: 150, aum: 42000, notablePortfolio: ["GitHub", "Lyft", "Coinbase", "Roblox", "Figma"], applyUrl: "https://a16z.com/portfolio/", isActive: true },
  { id: 3, name: "Y Combinator", description: "The world's most prestigious startup accelerator and early-stage investor.", website: "https://ycombinator.com", hqCity: "San Francisco", hqCountry: "USA", regions: ["Global"], stages: ["pre-seed", "seed"], sectors: ["saas", "fintech", "consumer", "healthcare", "ai", "deeptech"], checkSizeMin: 0.5, checkSizeMax: 0.5, aum: 500, notablePortfolio: ["Airbnb", "Stripe", "Dropbox", "Reddit", "DoorDash"], applyUrl: "https://www.ycombinator.com/apply", isActive: true },
  { id: 4, name: "Accel", description: "Global VC firm with deep expertise in enterprise, consumer, and infrastructure.", website: "https://accel.com", hqCity: "Palo Alto", hqCountry: "USA", regions: ["North America", "Europe", "India"], stages: ["seed", "series-a", "series-b"], sectors: ["saas", "security", "fintech", "consumer", "enterprise"], checkSizeMin: 0.5, checkSizeMax: 50, aum: 15000, notablePortfolio: ["Facebook", "Slack", "Dropbox", "Spotify", "Atlassian"], applyUrl: "https://accel.com/companies", isActive: true },
  { id: 5, name: "Benchmark", description: "Boutique VC known for early bets on Uber, Twitter, and Snap.", website: "https://benchmark.com", hqCity: "San Francisco", hqCountry: "USA", regions: ["North America"], stages: ["seed", "series-a"], sectors: ["consumer", "saas", "marketplace", "fintech"], checkSizeMin: 1, checkSizeMax: 25, aum: 3000, notablePortfolio: ["Uber", "Twitter", "Snap", "eBay", "Instagram"], applyUrl: "https://benchmark.com", isActive: true },
  { id: 6, name: "Index Ventures", description: "European-rooted global VC with offices in San Francisco and London.", website: "https://indexventures.com", hqCity: "San Francisco", hqCountry: "USA", regions: ["North America", "Europe"], stages: ["seed", "series-a", "series-b", "growth"], sectors: ["fintech", "saas", "consumer", "gaming", "marketplace"], checkSizeMin: 0.5, checkSizeMax: 100, aum: 10000, notablePortfolio: ["Dropbox", "Robinhood", "Revolut", "Figma", "Discord"], applyUrl: "https://indexventures.com/contact", isActive: true },
  { id: 7, name: "SoftBank Vision Fund", description: "Largest technology-focused VC fund in history.", website: "https://visionfund.com", hqCity: "Tokyo", hqCountry: "Japan", regions: ["Global"], stages: ["series-b", "growth"], sectors: ["ai", "robotics", "fintech", "logistics", "consumer"], checkSizeMin: 100, checkSizeMax: 5000, aum: 100000, notablePortfolio: ["Uber", "WeWork", "ByteDance", "DoorDash", "Grab"], applyUrl: "https://visionfund.com/contact", isActive: true },
  { id: 8, name: "500 Global", description: "Prolific early-stage VC with a global portfolio of 2,700+ companies.", website: "https://500.co", hqCity: "San Francisco", hqCountry: "USA", regions: ["Global", "MENA", "Southeast Asia", "Africa"], stages: ["pre-seed", "seed"], sectors: ["saas", "fintech", "consumer", "healthtech", "edtech"], checkSizeMin: 0.15, checkSizeMax: 1, aum: 2700, notablePortfolio: ["Canva", "Talkdesk", "Grab", "Careem"], applyUrl: "https://500.co/accelerators", isActive: true },
  { id: 9, name: "Wamda Capital", description: "MENA-focused VC investing in tech startups across the Arab world.", website: "https://wamda.com", hqCity: "Dubai", hqCountry: "UAE", regions: ["MENA"], stages: ["seed", "series-a"], sectors: ["fintech", "e-commerce", "saas", "healthtech", "edtech"], checkSizeMin: 0.5, checkSizeMax: 5, aum: 75, notablePortfolio: ["Fetchr", "Anghami", "Mumzworld"], applyUrl: "https://wamda.com/capital", isActive: true },
  { id: 10, name: "Algebra Ventures", description: "Egypt's leading VC firm focused on early-stage tech startups.", website: "https://algebraventures.com", hqCity: "Cairo", hqCountry: "Egypt", regions: ["MENA", "Africa"], stages: ["seed", "series-a"], sectors: ["fintech", "e-commerce", "logistics", "healthtech"], checkSizeMin: 0.5, checkSizeMax: 5, aum: 90, notablePortfolio: ["Swvl", "Halan", "Breadfast"], applyUrl: "https://algebraventures.com/portfolio", isActive: true },
  { id: 11, name: "Partech Africa", description: "Pan-African VC fund backing high-growth tech startups across the continent.", website: "https://partechpartners.com", hqCity: "Dakar", hqCountry: "Senegal", regions: ["Africa"], stages: ["seed", "series-a", "series-b"], sectors: ["fintech", "agtech", "healthtech", "logistics", "saas"], checkSizeMin: 0.5, checkSizeMax: 10, aum: 143, notablePortfolio: ["Wave", "Trade Depot", "Yoco"], applyUrl: "https://partechpartners.com/africa", isActive: true },
  { id: 12, name: "Sequoia Southeast Asia", description: "Sequoia's dedicated fund for Southeast Asian startups.", website: "https://sequoiacap.com/southeast-asia", hqCity: "Singapore", hqCountry: "Singapore", regions: ["Southeast Asia"], stages: ["seed", "series-a", "series-b", "growth"], sectors: ["fintech", "e-commerce", "saas", "consumer", "logistics"], checkSizeMin: 0.5, checkSizeMax: 50, aum: 2000, notablePortfolio: ["Grab", "Gojek", "Tokopedia", "Carousell"], applyUrl: "https://sequoiacap.com/southeast-asia", isActive: true },
  { id: 13, name: "Lightspeed Venture Partners", description: "Global VC with multi-stage investing across enterprise and consumer.", website: "https://lsvp.com", hqCity: "Menlo Park", hqCountry: "USA", regions: ["North America", "Europe", "India", "Southeast Asia"], stages: ["seed", "series-a", "series-b", "growth"], sectors: ["enterprise", "consumer", "fintech", "healthtech", "saas"], checkSizeMin: 0.5, checkSizeMax: 100, aum: 25000, notablePortfolio: ["Snap", "Affirm", "Mulesoft", "Nutanix", "OYO"], applyUrl: "https://lsvp.com/companies/", isActive: true },
  { id: 14, name: "Balderton Capital", description: "Europe's leading early-stage VC backing exceptional founders.", website: "https://balderton.com", hqCity: "London", hqCountry: "UK", regions: ["Europe"], stages: ["seed", "series-a", "series-b"], sectors: ["saas", "fintech", "marketplace", "consumer", "deeptech"], checkSizeMin: 1, checkSizeMax: 30, aum: 4000, notablePortfolio: ["Revolut", "Depop", "Kobalt", "Contentful", "Nutmeg"], applyUrl: "https://balderton.com/apply", isActive: true },
  { id: 15, name: "Tiger Global Management", description: "Prolific global investor known for fast decisions and large checks.", website: "https://tigerglobal.com", hqCity: "New York", hqCountry: "USA", regions: ["Global"], stages: ["series-b", "growth"], sectors: ["saas", "fintech", "consumer", "marketplace", "e-commerce"], checkSizeMin: 10, checkSizeMax: 500, aum: 95000, notablePortfolio: ["Stripe", "Coinbase", "Flipkart", "Bytedance", "Nubank"], applyUrl: "https://tigerglobal.com", isActive: true },
];

export const ANGEL_INVESTORS_DATA = [
  { id: 1, name: "Naval Ravikant", title: "Co-founder, AngelList", bio: "Prolific angel investor and philosopher of startups. Early backer of Twitter, Uber, and Yammer.", location: "San Francisco, USA", regions: ["North America", "Global"], stages: ["pre-seed", "seed"], sectors: ["saas", "crypto", "consumer", "marketplace"], checkSizeMin: 0.025, checkSizeMax: 0.25, notableInvestments: ["Twitter", "Uber", "Yammer", "Stack Overflow"], angellistUrl: "https://angel.co/naval", isActive: true },
  { id: 2, name: "Ron Conway", title: "Founder, SV Angel", bio: "The 'Godfather of Silicon Valley' — one of the most connected angels in tech.", location: "San Francisco, USA", regions: ["North America"], stages: ["pre-seed", "seed"], sectors: ["consumer", "saas", "marketplace", "fintech"], checkSizeMin: 0.05, checkSizeMax: 0.5, notableInvestments: ["Google", "Facebook", "Twitter", "PayPal", "Airbnb"], linkedinUrl: "https://linkedin.com/in/ronconway", isActive: true },
  { id: 3, name: "Esther Dyson", title: "Founder, EDventure Holdings", bio: "Veteran tech investor focused on healthcare, space, and emerging markets.", location: "New York, USA", regions: ["North America", "Europe", "Global"], stages: ["seed", "series-a"], sectors: ["healthtech", "edtech", "space", "consumer"], checkSizeMin: 0.05, checkSizeMax: 0.5, notableInvestments: ["23andMe", "Flickr", "Meetup", "Square"], linkedinUrl: "https://linkedin.com/in/estherdyson", isActive: true },
  { id: 4, name: "Fabrice Grinda", title: "Co-founder, FJ Labs", bio: "Serial entrepreneur turned prolific angel with 1,000+ investments globally.", location: "New York, USA", regions: ["Global", "Latin America", "MENA", "Africa"], stages: ["pre-seed", "seed"], sectors: ["marketplace", "fintech", "e-commerce", "consumer"], checkSizeMin: 0.1, checkSizeMax: 1, notableInvestments: ["Alibaba", "Coupang", "Letgo", "Rappi"], angellistUrl: "https://angel.co/fabricegrinda", isActive: true },
  { id: 5, name: "Shervin Pishevar", title: "Co-founder, Sherpa Capital", bio: "Early Uber investor and prominent Silicon Valley angel.", location: "San Francisco, USA", regions: ["North America", "MENA"], stages: ["seed", "series-a"], sectors: ["consumer", "marketplace", "fintech", "deeptech"], checkSizeMin: 0.1, checkSizeMax: 2, notableInvestments: ["Uber", "Airbnb", "Tumblr", "Warby Parker"], linkedinUrl: "https://linkedin.com/in/shervinpishevar", isActive: true },
  { id: 6, name: "Samih Toukan", title: "Co-founder, Jabbar Internet Group", bio: "MENA's most prominent tech entrepreneur and angel investor.", location: "Dubai, UAE", regions: ["MENA"], stages: ["seed", "series-a"], sectors: ["e-commerce", "fintech", "consumer", "saas"], checkSizeMin: 0.1, checkSizeMax: 2, notableInvestments: ["Maktoob", "Souq.com", "Careem", "Anghami"], linkedinUrl: "https://linkedin.com/in/samihtoukan", isActive: true },
  { id: 7, name: "Tunde Kehinde", title: "Co-founder, Lidya", bio: "African fintech pioneer and angel investor backing African startups.", location: "Lagos, Nigeria", regions: ["Africa"], stages: ["pre-seed", "seed"], sectors: ["fintech", "logistics", "e-commerce", "healthtech"], checkSizeMin: 0.025, checkSizeMax: 0.25, notableInvestments: ["Jumia", "Flutterwave", "Paystack"], linkedinUrl: "https://linkedin.com/in/tundekehinde", isActive: true },
  { id: 8, name: "Khailee Ng", title: "Managing Partner, 500 Southeast Asia", bio: "Southeast Asia's most active early-stage investor.", location: "Kuala Lumpur, Malaysia", regions: ["Southeast Asia"], stages: ["pre-seed", "seed"], sectors: ["fintech", "consumer", "saas", "healthtech", "edtech"], checkSizeMin: 0.05, checkSizeMax: 0.5, notableInvestments: ["Grab", "Carousell", "iPrice", "Kumu"], linkedinUrl: "https://linkedin.com/in/khaileeng", isActive: true },
  { id: 9, name: "Paul Buchheit", title: "Creator of Gmail, Partner at YC", bio: "Created Gmail, was #23 at Google, and is now an active YC partner and angel.", location: "San Francisco, USA", regions: ["North America", "Global"], stages: ["pre-seed", "seed"], sectors: ["saas", "consumer", "ai", "developer-tools"], checkSizeMin: 0.025, checkSizeMax: 0.25, notableInvestments: ["Airbnb", "Dropbox", "Stripe", "Reddit"], angellistUrl: "https://angel.co/paul", isActive: true },
  { id: 10, name: "Cyan Banister", title: "Partner, Long Journey Ventures", bio: "Early investor in Uber, SpaceX, and Niantic.", location: "San Francisco, USA", regions: ["North America"], stages: ["pre-seed", "seed"], sectors: ["consumer", "deeptech", "gaming", "saas"], checkSizeMin: 0.025, checkSizeMax: 0.5, notableInvestments: ["Uber", "SpaceX", "Niantic", "Postmates"], angellistUrl: "https://angel.co/cyan", isActive: true },
];

export const GRANTS_DATA = [
  { id: 1, name: "SBIR / STTR Program", provider: "US Federal Government", description: "America's largest source of early-stage R&D funding for small businesses. Non-dilutive grants across 11 federal agencies.", type: "government" as const, regions: ["North America"], sectors: ["deeptech", "biotech", "defense", "energy", "healthtech"], stages: ["pre-seed", "seed"], amountMin: 50000, amountMax: 2000000, currency: "USD", deadline: "Rolling (varies by agency)", isEquityFree: true, requirements: "US-based small business, R&D focus, meet agency-specific criteria", applyUrl: "https://www.sbir.gov/apply-for-funding", isActive: true },
  { id: 2, name: "Horizon Europe", provider: "European Commission", description: "EU's key funding programme for research and innovation with €95.5 billion budget.", type: "eu" as const, regions: ["Europe", "Global"], sectors: ["deeptech", "cleantech", "healthtech", "ai", "manufacturing"], stages: ["seed", "series-a"], amountMin: 50000, amountMax: 5000000, currency: "EUR", deadline: "Rolling (multiple calls per year)", isEquityFree: true, requirements: "EU-based or associated country, collaborative research projects", applyUrl: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home", isActive: true },
  { id: 3, name: "EIC Accelerator", provider: "European Innovation Council", description: "Flagship EU program for breakthrough deep-tech startups — up to €2.5M grant + €15M equity.", type: "eu" as const, regions: ["Europe"], sectors: ["deeptech", "cleantech", "biotech", "ai", "spacetech"], stages: ["seed", "series-a"], amountMin: 500000, amountMax: 2500000, currency: "EUR", deadline: "3 cut-offs per year", isEquityFree: false, requirements: "EU/associated country SME, breakthrough innovation, scalable business model", applyUrl: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en", isActive: true },
  { id: 4, name: "Innovate UK Smart Grants", provider: "Innovate UK", description: "UK government grants for game-changing R&D projects with commercial potential.", type: "government" as const, regions: ["Europe"], sectors: ["deeptech", "cleantech", "healthtech", "ai", "manufacturing"], stages: ["pre-seed", "seed", "series-a"], amountMin: 25000, amountMax: 2000000, currency: "GBP", deadline: "Rolling competitions", isEquityFree: true, requirements: "UK-based business, R&D project with clear commercial route", applyUrl: "https://www.ukri.org/councils/innovate-uk/", isActive: true },
  { id: 5, name: "Google for Startups Accelerator", provider: "Google", description: "Equity-free support including cloud credits, mentorship, and technical training.", type: "corporate" as const, regions: ["Global", "Africa", "MENA", "Southeast Asia", "Latin America"], sectors: ["ai", "saas", "fintech", "healthtech", "edtech"], stages: ["seed", "series-a"], amountMin: 100000, amountMax: 200000, currency: "USD", deadline: "Rolling applications", isEquityFree: true, requirements: "Seed to Series A, tech-focused startup", applyUrl: "https://startup.google.com/programs/accelerator/", isActive: true },
  { id: 6, name: "AWS Activate", provider: "Amazon Web Services", description: "Up to $100K in AWS credits plus technical support and training.", type: "corporate" as const, regions: ["Global"], sectors: ["saas", "ai", "fintech", "healthtech", "e-commerce"], stages: ["pre-seed", "seed"], amountMin: 1000, amountMax: 100000, currency: "USD", deadline: "Rolling", isEquityFree: true, requirements: "Early-stage startup, not yet an AWS customer at scale", applyUrl: "https://aws.amazon.com/activate/", isActive: true },
  { id: 7, name: "MENA Region ITIDA Grants", provider: "Information Technology Industry Development Agency (Egypt)", description: "Egyptian government grants for tech startups and digital transformation projects.", type: "government" as const, regions: ["MENA", "Africa"], sectors: ["saas", "fintech", "e-commerce", "ai", "edtech"], stages: ["pre-seed", "seed"], amountMin: 10000, amountMax: 250000, currency: "USD", deadline: "Rolling", isEquityFree: true, requirements: "Egypt-registered company, technology focus", applyUrl: "https://itida.gov.eg", isActive: true },
  { id: 8, name: "Tony Elumelu Foundation Grant", provider: "Tony Elumelu Foundation", description: "Flagship African entrepreneurship program — $5,000 seed capital + mentorship for 1,000 entrepreneurs annually.", type: "foundation" as const, regions: ["Africa"], sectors: ["fintech", "agtech", "healthtech", "consumer", "manufacturing"], stages: ["pre-seed"], amountMin: 5000, amountMax: 5000, currency: "USD", deadline: "Annual (January–March)", isEquityFree: true, requirements: "African entrepreneur, early-stage business, commitment to 12-week program", applyUrl: "https://www.tonyelumelufoundation.org/teep", isActive: true },
  { id: 9, name: "Startup Chile SCALE", provider: "Government of Chile / CORFO", description: "Chilean government program for high-impact startups with up to $80K equity-free funding.", type: "government" as const, regions: ["Latin America", "Global"], sectors: ["saas", "fintech", "agtech", "cleantech", "healthtech"], stages: ["seed", "series-a"], amountMin: 30000, amountMax: 80000, currency: "USD", deadline: "Semi-annual", isEquityFree: true, requirements: "Startup with traction, willing to operate in Chile for 6 months", applyUrl: "https://startupchile.org", isActive: true },
  { id: 10, name: "Microsoft for Startups Founders Hub", provider: "Microsoft", description: "Up to $150K in Azure credits plus GitHub, LinkedIn, and Microsoft 365 benefits.", type: "corporate" as const, regions: ["Global"], sectors: ["saas", "ai", "fintech", "healthtech", "developer-tools"], stages: ["pre-seed", "seed", "series-a"], amountMin: 1000, amountMax: 150000, currency: "USD", deadline: "Rolling", isEquityFree: true, requirements: "Early-stage startup, no prior Microsoft Founders Hub membership", applyUrl: "https://foundershub.startups.microsoft.com/", isActive: true },
  { id: 11, name: "Stripe Atlas + Stripe Climate", provider: "Stripe", description: "Incorporate your startup and access Stripe's global payments infrastructure with startup credits.", type: "corporate" as const, regions: ["Global"], sectors: ["fintech", "saas", "e-commerce", "marketplace"], stages: ["pre-seed", "seed"], amountMin: 5000, amountMax: 20000, currency: "USD", deadline: "Rolling", isEquityFree: true, requirements: "New startup looking to incorporate and use Stripe payments", applyUrl: "https://stripe.com/atlas", isActive: true },
  { id: 12, name: "DIFC Fintech Hive Grant", provider: "Dubai International Financial Centre", description: "MENA's leading fintech accelerator with funding and regulatory sandbox access.", type: "government" as const, regions: ["MENA"], sectors: ["fintech", "insurtech", "regtech", "wealthtech"], stages: ["seed", "series-a"], amountMin: 50000, amountMax: 200000, currency: "USD", deadline: "Annual", isEquityFree: false, requirements: "Fintech startup, willing to operate in DIFC, regulatory compliance", applyUrl: "https://fintechhive.difc.ae", isActive: true },
];

export const VENTURE_LAWYERS_DATA = [
  { id: 1, name: "Wilson Sonsini Goodrich & Rosati", firm: "Wilson Sonsini", title: "Leading Startup Law Firm", bio: "The go-to law firm for Silicon Valley startups. Represents more VC-backed companies than any other firm.", location: "Palo Alto, USA", regions: ["North America", "Europe"], specializations: ["term-sheets", "equity", "m&a", "ipo", "ip", "employment"], languages: ["English"], startupFriendly: true, offersFreeConsult: false, websiteUrl: "https://wsgr.com", isActive: true },
  { id: 2, name: "Cooley LLP", firm: "Cooley LLP", title: "Startup & VC Law Firm", bio: "Globally recognized for startup formation, VC financing, and M&A. Offers deferred fee arrangements for early-stage companies.", location: "San Francisco, USA", regions: ["North America", "Europe", "Asia"], specializations: ["term-sheets", "equity", "m&a", "ip", "employment", "corporate"], languages: ["English"], startupFriendly: true, offersFreeConsult: true, websiteUrl: "https://cooley.com", isActive: true },
  { id: 3, name: "Gunderson Dettmer", firm: "Gunderson Dettmer", title: "Venture Capital & Startup Law", bio: "Exclusive focus on venture capital and emerging companies. Known for speed and startup-friendly pricing.", location: "Redwood City, USA", regions: ["North America", "Europe", "Asia"], specializations: ["term-sheets", "equity", "venture-capital", "corporate", "ip"], languages: ["English"], startupFriendly: true, offersFreeConsult: false, websiteUrl: "https://gunder.com", isActive: true },
  { id: 4, name: "Orrick, Herrington & Sutcliffe", firm: "Orrick", title: "Technology & Startup Law", bio: "Orrick's startup program offers free legal resources and deferred fees for early-stage companies.", location: "San Francisco, USA", regions: ["North America", "Europe", "Asia"], specializations: ["term-sheets", "equity", "ip", "employment", "m&a", "privacy"], languages: ["English", "French", "German", "Italian"], startupFriendly: true, offersFreeConsult: true, websiteUrl: "https://orrick.com/startups", isActive: true },
  { id: 5, name: "Taylor Wessing", firm: "Taylor Wessing", title: "European Tech & Startup Law", bio: "Leading European law firm for tech startups, with deep expertise in UK and EU venture transactions.", location: "London, UK", regions: ["Europe", "MENA"], specializations: ["term-sheets", "equity", "ip", "employment", "gdpr", "m&a"], languages: ["English", "German", "French", "Dutch"], startupFriendly: true, offersFreeConsult: true, websiteUrl: "https://taylorwessing.com", isActive: true },
  { id: 6, name: "Fieldfisher", firm: "Fieldfisher", title: "European Startup & VC Law", bio: "Pan-European firm with strong startup practice across UK, Germany, France, and Benelux.", location: "London, UK", regions: ["Europe"], specializations: ["term-sheets", "equity", "ip", "employment", "gdpr"], languages: ["English", "German", "French", "Dutch", "Italian"], startupFriendly: true, offersFreeConsult: false, websiteUrl: "https://fieldfisher.com", isActive: true },
  { id: 7, name: "Al Tamimi & Company", firm: "Al Tamimi & Company", title: "MENA Startup & Corporate Law", bio: "The largest law firm in the Middle East with dedicated startup and venture capital practice.", location: "Dubai, UAE", regions: ["MENA"], specializations: ["corporate", "equity", "ip", "employment", "regulatory", "m&a"], languages: ["English", "Arabic"], startupFriendly: true, offersFreeConsult: false, websiteUrl: "https://tamimi.com", isActive: true },
  { id: 8, name: "Hadef & Partners", firm: "Hadef & Partners", title: "UAE Startup & Commercial Law", bio: "UAE-based firm with strong focus on tech startups, DIFC regulations, and venture financing.", location: "Dubai, UAE", regions: ["MENA"], specializations: ["corporate", "equity", "regulatory", "ip", "employment"], languages: ["English", "Arabic"], startupFriendly: true, offersFreeConsult: true, websiteUrl: "https://hadefpartners.com", isActive: true },
  { id: 9, name: "Bowmans", firm: "Bowmans", title: "Pan-African Startup & Corporate Law", bio: "Africa's leading independent law firm with offices in 8 African countries.", location: "Johannesburg, South Africa", regions: ["Africa"], specializations: ["corporate", "equity", "regulatory", "m&a", "ip"], languages: ["English", "French", "Portuguese"], startupFriendly: true, offersFreeConsult: false, websiteUrl: "https://bowmanslaw.com", isActive: true },
  { id: 10, name: "Rajah & Tann Asia", firm: "Rajah & Tann", title: "Southeast Asia Startup & VC Law", bio: "Southeast Asia's largest law firm network with startup and venture capital expertise across 10 countries.", location: "Singapore", regions: ["Southeast Asia"], specializations: ["corporate", "equity", "ip", "employment", "regulatory", "m&a"], languages: ["English", "Mandarin", "Bahasa", "Thai", "Vietnamese"], startupFriendly: true, offersFreeConsult: false, websiteUrl: "https://rajahTann.com", isActive: true },
  { id: 11, name: "Fenwick & West", firm: "Fenwick & West", title: "Silicon Valley Tech Law", bio: "Boutique firm exclusively serving technology and life sciences companies. Deep VC expertise.", location: "Silicon Valley, USA", regions: ["North America"], specializations: ["term-sheets", "equity", "ip", "employment", "m&a", "ipo"], languages: ["English"], startupFriendly: true, offersFreeConsult: false, websiteUrl: "https://fenwick.com", isActive: true },
  { id: 12, name: "Latham & Watkins", firm: "Latham & Watkins", title: "Global Startup & VC Law", bio: "Global firm with one of the world's largest venture capital practices.", location: "Los Angeles, USA", regions: ["North America", "Europe", "Asia", "MENA"], specializations: ["term-sheets", "equity", "m&a", "ipo", "ip", "regulatory"], languages: ["English", "French", "German", "Spanish", "Arabic", "Mandarin"], startupFriendly: true, offersFreeConsult: false, websiteUrl: "https://lw.com", isActive: true },
];

export const resourcesRouter = router({
  // ── VC Firms ──────────────────────────────────────────────────────────────
  getVcFirms: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      stage: z.string().optional(),
      sector: z.string().optional(),
      region: z.string().optional(),
    }).optional())
    .query(({ input }) => {
      let data = VC_FIRMS_DATA;
      if (input?.search) {
        const q = input.search.toLowerCase();
        data = data.filter(f =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          (f.notablePortfolio as string[]).some(p => p.toLowerCase().includes(q))
        );
      }
      if (input?.stage) {
        data = data.filter(f => (f.stages as string[]).includes(input.stage!));
      }
      if (input?.sector) {
        data = data.filter(f => (f.sectors as string[]).some(s => s.includes(input.sector!.toLowerCase())));
      }
      if (input?.region) {
        data = data.filter(f => (f.regions as string[]).some(r => r.toLowerCase().includes(input.region!.toLowerCase())));
      }
      return data;
    }),

  // ── Angel Investors ───────────────────────────────────────────────────────
  getAngelInvestors: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      stage: z.string().optional(),
      sector: z.string().optional(),
      region: z.string().optional(),
    }).optional())
    .query(({ input }) => {
      let data = ANGEL_INVESTORS_DATA;
      if (input?.search) {
        const q = input.search.toLowerCase();
        data = data.filter(a =>
          a.name.toLowerCase().includes(q) ||
          a.bio.toLowerCase().includes(q) ||
          (a.notableInvestments as string[]).some(i => i.toLowerCase().includes(q))
        );
      }
      if (input?.stage) {
        data = data.filter(a => (a.stages as string[]).includes(input.stage!));
      }
      if (input?.sector) {
        data = data.filter(a => (a.sectors as string[]).some(s => s.includes(input.sector!.toLowerCase())));
      }
      if (input?.region) {
        data = data.filter(a => (a.regions as string[]).some(r => r.toLowerCase().includes(input.region!.toLowerCase())));
      }
      return data;
    }),

  // ── Grants ────────────────────────────────────────────────────────────────
  getGrants: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      type: z.string().optional(),
      sector: z.string().optional(),
      region: z.string().optional(),
      equityFreeOnly: z.boolean().optional(),
    }).optional())
    .query(({ input }) => {
      let data = GRANTS_DATA;
      if (input?.search) {
        const q = input.search.toLowerCase();
        data = data.filter(g =>
          g.name.toLowerCase().includes(q) ||
          g.provider.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
        );
      }
      if (input?.type) {
        data = data.filter(g => g.type === input.type);
      }
      if (input?.sector) {
        data = data.filter(g => (g.sectors as string[]).some(s => s.includes(input.sector!.toLowerCase())));
      }
      if (input?.region) {
        data = data.filter(g => (g.regions as string[]).some(r => r.toLowerCase().includes(input.region!.toLowerCase())));
      }
      if (input?.equityFreeOnly) {
        data = data.filter(g => g.isEquityFree);
      }
      return data;
    }),

  // ── Venture Lawyers ───────────────────────────────────────────────────────
  getVentureLawyers: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      region: z.string().optional(),
      specialization: z.string().optional(),
      freeConsultOnly: z.boolean().optional(),
    }).optional())
    .query(({ input }) => {
      let data = VENTURE_LAWYERS_DATA;
      if (input?.search) {
        const q = input.search.toLowerCase();
        data = data.filter(l =>
          l.name.toLowerCase().includes(q) ||
          l.firm.toLowerCase().includes(q) ||
          l.bio.toLowerCase().includes(q)
        );
      }
      if (input?.region) {
        data = data.filter(l => (l.regions as string[]).some(r => r.toLowerCase().includes(input.region!.toLowerCase())));
      }
      if (input?.specialization) {
        data = data.filter(l => (l.specializations as string[]).some(s => s.includes(input.specialization!.toLowerCase())));
      }
      if (input?.freeConsultOnly) {
        data = data.filter(l => l.offersFreeConsult);
      }
      return data;
    }),
});
