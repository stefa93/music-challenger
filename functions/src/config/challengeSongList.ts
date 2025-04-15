/**
 * Curated list of challenges and their associated songs.
 * Each song is split into { title, artist } for reliable lookup.
 */

// Helper function to safely split song string
function parseSongString(songString: string): { title: string; artist: string } {
  const lastSeparatorIndex = songString.lastIndexOf(' - ');
  if (lastSeparatorIndex === -1) {
    // Handle cases where the separator is missing or different
    console.warn(`Could not parse artist from song string: "${songString}"`);
    return { title: songString.trim(), artist: 'Unknown Artist' };
  }
  const title = songString.substring(0, lastSeparatorIndex).trim();
  const artist = songString.substring(lastSeparatorIndex + 3).trim();
  // Handle potential extra info in parentheses in artist name (e.g., from "Titanic")
  const artistCleaned = artist.replace(/\s*\(.*\)$/, '').trim();
  return { title, artist: artistCleaned };
}

export const challengeSongList = [
  {
    challenge: "Songs with a color in the title",
    songs: [
      "Purple Rain - Prince",
      "Yellow Submarine - The Beatles",
      "Paint It Black - The Rolling Stones",
      "Back in Black - AC/DC",
      "Blue (Da Ba Dee) - Eiffel 65",
      "Little Red Corvette - Prince",
      "Brown Eyed Girl - Van Morrison",
      "99 Red Balloons - Nena",
      "Black or White - Michael Jackson",
      "Blue Suede Shoes - Elvis Presley",
      "Mellow Yellow - Donovan",
      "Green Onions - Booker T. & the M.G.'s",
      "Black Hole Sun - Soundgarden",
      "White Room - Cream",
      "Lady in Red - Chris de Burgh"
    ]
  },
  {
    challenge: "Best song to listen to on a rainy day",
    songs: [
      "November Rain - Guns N' Roses",
      "Have You Ever Seen the Rain - Creedence Clearwater Revival",
      "Umbrella - Rihanna ft. Jay-Z",
      "Singin' in the Rain - Gene Kelly",
      "No Rain - Blind Melon",
      "Raindrops Keep Fallin' on My Head - B.J. Thomas",
      "Here Comes the Rain Again - Eurythmics",
      "Only Happy When It Rains - Garbage",
      "Rainy Days and Mondays - Carpenters",
      "Riders on the Storm - The Doors",
      "Set Fire to the Rain - Adele",
      "Why Does It Always Rain on Me? - Travis",
      "It Will Rain - Bruno Mars",
      "I Can't Stand the Rain - Ann Peebles",
      "Rainy Night in Georgia - Brook Benton"
    ]
  },
  {
    challenge: "Ultimate workout power song",
    songs: [
      "Eye of the Tiger - Survivor",
      "Lose Yourself - Eminem",
      "Welcome to the Jungle - Guns N' Roses",
      "Thunderstruck - AC/DC",
      "Can't Hold Us - Macklemore & Ryan Lewis ft. Ray Dalton",
      "'Till I Collapse - Eminem ft. Nate Dogg",
      "Stronger - Kanye West",
      "Pump It - Black Eyed Peas",
      "Sandstorm - Darude",
      "Enter Sandman - Metallica",
      "Hall of Fame - The Script ft. will.i.am",
      "Seven Nation Army - The White Stripes",
      "We Will Rock You - Queen",
      "Remember the Name - Fort Minor",
      "Believer - Imagine Dragons"
    ]
  },
  {
    challenge: "Most relaxing instrumental track",
    songs: [
      "Weightless - Marconi Union",
      "Clair de Lune - Claude Debussy",
      "Gymnopédie No.1 - Erik Satie",
      "Canon in D - Johann Pachelbel",
      "Air on the G String - J.S. Bach",
      "Cavatina (Theme from The Deer Hunter) - Stanley Myers",
      "Sleep Walk - Santo & Johnny",
      "Albatross - Fleetwood Mac",
      "Blue in Green - Miles Davis",
      "Music for Airports (1/1) - Brian Eno",
      "Your Hand in Mine - Explosions in the Sky",
      "Chariots of Fire - Vangelis",
      "Theme from Somewhere in Time - John Barry",
      "Gabriel's Oboe - Ennio Morricone",
      "Nocturne in E-flat major, Op. 9 No. 2 - Frédéric Chopin"
    ]
  },
  {
    challenge: "Guilty pleasure pop anthem",
    songs: [
      "Never Gonna Give You Up - Rick Astley",
      "Barbie Girl - Aqua",
      "Call Me Maybe - Carly Rae Jepsen",
      "Wannabe - Spice Girls",
      "Dancing Queen - ABBA",
      "Party in the U.S.A. - Miley Cyrus",
      "All Star - Smash Mouth",
      "Livin' La Vida Loca - Ricky Martin",
      "Macarena - Los Del Río",
      "...Baby One More Time - Britney Spears",
      "We Built This City - Starship",
      "I'm Too Sexy - Right Said Fred",
      "Mambo No. 5 - Lou Bega",
      "Believe - Cher",
      "Cotton Eye Joe - Rednex"
    ]
  },
  {
    challenge: "Song that makes you want to dance immediately",
    songs: [
      "Don't Stop 'Til You Get Enough - Michael Jackson",
      "I Wanna Dance with Somebody - Whitney Houston",
      "Get Lucky - Daft Punk ft. Pharrell Williams",
      "Yeah! - Usher ft. Lil Jon & Ludacris",
      "One More Time - Daft Punk",
      "Le Freak - Chic",
      "September - Earth, Wind & Fire",
      "Hips Don't Lie - Shakira ft. Wyclef Jean",
      "Let's Dance - David Bowie",
      "Everybody (Backstreet's Back) - Backstreet Boys",
      "Dancing Queen - ABBA",
      "Twist and Shout - The Beatles",
      "Hey Ya! - Outkast",
      "Footloose - Kenny Loggins",
      "Can't Stop the Feeling! - Justin Timberlake"
    ]
  },
  {
    challenge: "Best road trip sing-along song",
    songs: [
      "Bohemian Rhapsody - Queen",
      "Don't Stop Believin' - Journey",
      "Sweet Home Alabama - Lynyrd Skynyrd",
      "Take Me Home, Country Roads - John Denver",
      "Livin' on a Prayer - Bon Jovi",
      "I Want It That Way - Backstreet Boys",
      "Hotel California - Eagles",
      "Born to Run - Bruce Springsteen",
      "On the Road Again - Willie Nelson",
      "Sweet Caroline - Neil Diamond",
      "Africa - Toto",
      "Hey Jude - The Beatles",
      "Life Is a Highway - Tom Cochrane",
      "American Pie - Don McLean",
      "Walking in Memphis - Marc Cohn"
    ]
  },
  {
    challenge: "A song featuring an epic guitar solo",
    songs: [
      "Stairway to Heaven - Led Zeppelin",
      "Free Bird - Lynyrd Skynyrd",
      "Comfortably Numb - Pink Floyd",
      "Eruption - Van Halen",
      "Hotel California - Eagles",
      "November Rain - Guns N' Roses",
      "All Along the Watchtower - The Jimi Hendrix Experience",
      "One - Metallica",
      "Sultans of Swing - Dire Straits",
      "Crazy Train - Ozzy Osbourne",
      "While My Guitar Gently Weeps - The Beatles",
      "Beat It - Michael Jackson",
      "Highway Star - Deep Purple",
      "Layla - Derek & the Dominos",
      "Johnny B. Goode - Chuck Berry"
    ]
  },
  {
    challenge: "Song with a number in the title",
    songs: [
      "1999 - Prince",
      "Summer of '69 - Bryan Adams",
      "One - U2",
      "99 Problems - Jay-Z",
      "867-5309/Jenny - Tommy Tutone",
      "Mambo No. 5 (A Little Bit Of...) - Lou Bega",
      "Seven Nation Army - The White Stripes",
      "One Week - Barenaked Ladies",
      "50 Ways to Leave Your Lover - Paul Simon",
      "When I'm Sixty-Four - The Beatles",
      "25 or 6 to 4 - Chicago",
      "Two Princes - Spin Doctors",
      "Three Little Birds - Bob Marley & The Wailers",
      "99 Luftballons - Nena",
      "1234 - Feist"
    ]
  },
  {
    challenge: "Perfect song for cooking dinner",
    songs: [
      "Fly Me to the Moon - Frank Sinatra",
      "Sunday Morning - Maroon 5",
      "Put Your Records On - Corinne Bailey Rae",
      "Lovely Day - Bill Withers",
      "Sway - Dean Martin",
      "Is This Love - Bob Marley & The Wailers",
      "Dreams - Fleetwood Mac",
      "September - Earth, Wind & Fire",
      "Banana Pancakes - Jack Johnson",
      "Come Away With Me - Norah Jones",
      "L-O-V-E - Nat King Cole",
      "Valerie - Mark Ronson ft. Amy Winehouse",
      "Watermelon Sugar - Harry Styles",
      "Cheek to Cheek - Ella Fitzgerald & Louis Armstrong",
      "Summer Breeze - Seals & Crofts"
    ]
  },
  {
    challenge: "A song that tells a great story",
    songs: [
      "Hurricane - Bob Dylan",
      "Stan - Eminem ft. Dido",
      "Cat's in the Cradle - Harry Chapin",
      "The Devil Went Down to Georgia - The Charlie Daniels Band",
      "Fast Car - Tracy Chapman",
      "Piano Man - Billy Joel",
      "Hotel California - Eagles",
      "A Boy Named Sue - Johnny Cash",
      "The Wreck of the Edmund Fitzgerald - Gordon Lightfoot",
      "Space Oddity - David Bowie",
      "Jack & Diane - John Mellencamp",
      "Copacabana (At the Copa) - Barry Manilow",
      "El Paso - Marty Robbins",
      "The Gambler - Kenny Rogers",
      "Ode to Billie Joe - Bobbie Gentry"
    ]
  },
  {
    challenge: "Best song from a movie soundtrack",
    songs: [
      "My Heart Will Go On - Celine Dion (from \"Titanic\")",
      "I Will Always Love You - Whitney Houston (from \"The Bodyguard\")",
      "Stayin' Alive - Bee Gees (from \"Saturday Night Fever\")",
      "Eye of the Tiger - Survivor (from \"Rocky III\")",
      "Ghostbusters - Ray Parker Jr. (from \"Ghostbusters\")",
      "Footloose - Kenny Loggins (from \"Footloose\")",
      "Lose Yourself - Eminem (from \"8 Mile\")",
      "Don't You (Forget About Me) - Simple Minds (from \"The Breakfast Club\")",
      "Shallow - Lady Gaga & Bradley Cooper (from \"A Star Is Born\")",
      "Take My Breath Away - Berlin (from \"Top Gun\")",
      "Circle of Life - Elton John (from \"The Lion King\")",
      "Let It Go - Idina Menzel (from \"Frozen\")",
      "The Power of Love - Huey Lewis & The News (from \"Back to the Future\")",
      "Mrs. Robinson - Simon & Garfunkel (from \"The Graduate\")",
      "(I've Had) The Time of My Life - Bill Medley & Jennifer Warnes (from \"Dirty Dancing\")"
    ]
  },
  {
    challenge: "Song that reminds you of summer",
    songs: [
      "Summer of '69 - Bryan Adams",
      "Summer Nights - John Travolta & Olivia Newton-John",
      "Summertime - DJ Jazzy Jeff & The Fresh Prince",
      "Walking on Sunshine - Katrina & The Waves",
      "California Gurls - Katy Perry ft. Snoop Dogg",
      "Summer in the City - The Lovin' Spoonful",
      "Surfin' U.S.A. - The Beach Boys",
      "In the Summertime - Mungo Jerry",
      "Hot in Herre - Nelly",
      "Cruel Summer - Bananarama",
      "The Boys of Summer - Don Henley",
      "Here Comes the Sun - The Beatles",
      "School's Out - Alice Cooper",
      "Island in the Sun - Weezer",
      "Summer - Calvin Harris"
    ]
  },
  {
    challenge: "A track with amazing bassline",
    songs: [
      "Another One Bites the Dust - Queen",
      "Billie Jean - Michael Jackson",
      "Come Together - The Beatles",
      "Under Pressure - Queen & David Bowie",
      "Good Times - Chic",
      "Money - Pink Floyd",
      "Seven Nation Army - The White Stripes",
      "I Want You Back - The Jackson 5",
      "Longview - Green Day",
      "Feel Good Inc. - Gorillaz",
      "Stand by Me - Ben E. King",
      "Schism - Tool",
      "Around the World - Red Hot Chili Peppers",
      "Low Rider - War",
      "Super Freak - Rick James"
    ]
  },
  {
    challenge: "Song to play air guitar to",
    songs: [
      "Smoke on the Water - Deep Purple",
      "Sweet Child o' Mine - Guns N' Roses",
      "Back in Black - AC/DC",
      "Beat It - Michael Jackson",
      "Johnny B. Goode - Chuck Berry",
      "Barracuda - Heart",
      "Crazy Train - Ozzy Osbourne",
      "Hotel California - Eagles",
      "Whole Lotta Love - Led Zeppelin",
      "All Right Now - Free",
      "Free Bird - Lynyrd Skynyrd",
      "Thunderstruck - AC/DC",
      "Layla - Derek & the Dominos",
      "(I Can't Get No) Satisfaction - The Rolling Stones",
      "Smells Like Teen Spirit - Nirvana"
    ]
  },
  {
    challenge: "Most uplifting and optimistic song",
    songs: [
      "What a Wonderful World - Louis Armstrong",
      "Don't Stop Me Now - Queen",
      "Here Comes the Sun - The Beatles",
      "Walking on Sunshine - Katrina & The Waves",
      "Three Little Birds - Bob Marley & The Wailers",
      "Beautiful Day - U2",
      "Good Vibrations - The Beach Boys",
      "I Can See Clearly Now - Johnny Nash",
      "Happy - Pharrell Williams",
      "Lovely Day - Bill Withers",
      "You Make My Dreams - Daryl Hall & John Oates",
      "Best Day of My Life - American Authors",
      "Don't Worry, Be Happy - Bobby McFerrin",
      "It's a Beautiful Morning - The Rascals",
      "I'm a Believer - The Monkees"
    ]
  },
  {
    challenge: "A song in a language you don't speak",
    songs: [
      "Despacito - Luis Fonsi ft. Daddy Yankee (Spanish)",
      "Gangnam Style - PSY (Korean)",
      "99 Luftballons - Nena (German)",
      "Macarena - Los Del Río (Spanish)",
      "La Vie En Rose - Édith Piaf (French)",
      "Dragostea Din Tei - O-Zone (Romanian)",
      "Sukiyaki (Ue o Muite Arukō) - Kyu Sakamoto (Japanese)",
      "Bamboleo - Gipsy Kings (Spanish)",
      "Gasolina - Daddy Yankee (Spanish)",
      "Alors on danse - Stromae (French)",
      "Volare - Domenico Modugno (Italian)",
      "Ai Se Eu Te Pego - Michel Teló (Portuguese)",
      "Lambada (Chorando Se Foi) - Kaoma (Portuguese)",
      "O Fortuna - Carl Orff (Latin)",
      "Waka Waka (Esto Es África) - Shakira (Spanish)"
    ]
  },
  {
    challenge: "Best song to wake up to",
    songs: [
      "Here Comes the Sun - The Beatles",
      "Lovely Day - Bill Withers",
      "Good Morning - Kanye West",
      "Wake Me Up - Avicii",
      "Mr. Blue Sky - Electric Light Orchestra",
      "Morning Has Broken - Cat Stevens",
      "Best Day of My Life - American Authors",
      "Brand New Day - Sting",
      "Three Little Birds - Bob Marley & The Wailers",
      "Viva La Vida - Coldplay",
      "Walking on Sunshine - Katrina & The Waves",
      "Feeling Good - Nina Simone",
      "Unwritten - Natasha Bedingfield",
      "Good Morning Starshine - Oliver",
      "Rise and Shine - Kassidy"
    ]
  },
  {
    challenge: "A song featuring a saxophone",
    songs: [
      "Careless Whisper - George Michael",
      "Baker Street - Gerry Rafferty",
      "Born to Run - Bruce Springsteen",
      "Who Can It Be Now? - Men at Work",
      "Smooth Operator - Sade",
      "Jungleland - Bruce Springsteen",
      "Urgent - Foreigner",
      "Never Tear Us Apart - INXS",
      "Moondance - Van Morrison",
      "Your Latest Trick - Dire Straits",
      "Money - Pink Floyd",
      "Old Time Rock & Roll - Bob Seger",
      "Maneater - Hall & Oates",
      "Rio - Duran Duran",
      "Yakety Sax - Boots Randolph"
    ]
  },
  {
    challenge: "Track with the weirdest sound effects",
    songs: [
      "Good Vibrations - The Beach Boys",
      "Whole Lotta Love - Led Zeppelin",
      "I Am the Walrus - The Beatles",
      "Money - Pink Floyd",
      "Thriller - Michael Jackson",
      "Bicycle Race - Queen",
      "What Does the Fox Say - Ylvis",
      "Tomorrow Never Knows - The Beatles",
      "Hocus Pocus - Focus",
      "Popcorn - Hot Butter",
      "They're Coming to Take Me Away, Ha-Haaa! - Napoleon XIV",
      "Surfin' Bird - The Trashmen",
      "Witch Doctor - David Seville",
      "Mr. Roboto - Styx",
      "Bohemian Rhapsody - Queen"
    ]
  },
  {
    challenge: "Song that feels like a warm hug",
    songs: [
      "Lean on Me - Bill Withers",
      "You've Got a Friend - James Taylor",
      "Let It Be - The Beatles",
      "Imagine - John Lennon",
      "Bridge Over Troubled Water - Simon & Garfunkel",
      "Fix You - Coldplay",
      "True Colors - Cyndi Lauper",
      "Rainbow Connection - Kermit (Jim Henson)",
      "I'll Stand By You - The Pretenders",
      "Better Together - Jack Johnson",
      "Fields of Gold - Sting",
      "Somewhere Over the Rainbow/What a Wonderful World - Israel Kamakawiwo'ole",
      "Sweet Baby James - James Taylor",
      "Count on Me - Bruno Mars",
      "You Raise Me Up - Josh Groban"
    ]
  },
  {
    challenge: "Best cover song you've ever heard",
    songs: [
      "All Along the Watchtower - Jimi Hendrix (Bob Dylan cover)",
      "Hallelujah - Jeff Buckley (Leonard Cohen cover)",
      "I Will Always Love You - Whitney Houston (Dolly Parton cover)",
      "Nothing Compares 2 U - Sinéad O'Connor (Prince cover)",
      "Respect - Aretha Franklin (Otis Redding cover)",
      "Hurt - Johnny Cash (Nine Inch Nails cover)",
      "Mad World - Michael Andrews ft. Gary Jules (Tears for Fears cover)",
      "Twist and Shout - The Beatles (Isley Brothers cover)",
      "Tainted Love - Soft Cell (Gloria Jones cover)",
      "Knockin' on Heaven's Door - Guns N' Roses (Bob Dylan cover)",
      "The Man Who Sold the World - Nirvana (David Bowie cover)",
      "Proud Mary - Ike & Tina Turner (Creedence Clearwater Revival cover)",
      "Smooth Criminal - Alien Ant Farm (Michael Jackson cover)",
      "Africa - Weezer (Toto cover)",
      "Take Me to the River - Talking Heads (Al Green cover)"
    ]
  },
  {
    challenge: "A song that mentions a city or place",
    songs: [
      "New York, New York - Frank Sinatra",
      "London Calling - The Clash",
      "Sweet Home Alabama - Lynyrd Skynyrd",
      "No Sleep Till Brooklyn - Beastie Boys",
      "Africa - Toto",
      "Walking in Memphis - Marc Cohn",
      "Empire State of Mind - Jay-Z ft. Alicia Keys",
      "Kokomo - The Beach Boys",
      "Viva Las Vegas - Elvis Presley",
      "I Love L.A. - Randy Newman",
      "Budapest - George Ezra",
      "Streets of Philadelphia - Bruce Springsteen",
      "Beverly Hills - Weezer",
      "Californication - Red Hot Chili Peppers",
      "Do You Know the Way to San Jose - Dionne Warwick"
    ]
  },
  {
    challenge: "The ultimate 'power ballad'",
    songs: [
      "Total Eclipse of the Heart - Bonnie Tyler",
      "I Don't Want to Miss a Thing - Aerosmith",
      "November Rain - Guns N' Roses",
      "Every Rose Has Its Thorn - Poison",
      "Alone - Heart",
      "I Want to Know What Love Is - Foreigner",
      "Always - Bon Jovi",
      "Open Arms - Journey",
      "Wind of Change - Scorpions",
      "Heaven - Bryan Adams",
      "Nothing Compares 2 U - Sinéad O'Connor",
      "Making Love Out of Nothing at All - Air Supply",
      "Beth - KISS",
      "When I See You Smile - Bad English",
      "Is This Love - Whitesnake"
    ]
  },
  {
    challenge: "Song with a one-word title",
    songs: [
      "Imagine - John Lennon",
      "Yesterday - The Beatles",
      "Thriller - Michael Jackson",
      "Respect - Aretha Franklin",
      "Hallelujah - Jeff Buckley",
      "Believe - Cher",
      "Smooth - Santana ft. Rob Thomas",
      "Hello - Adele",
      "Royals - Lorde",
      "Crazy - Gnarls Barkley",
      "Wonderwall - Oasis",
      "Dreams - Fleetwood Mac",
      "Bad - Michael Jackson",
      "Help! - The Beatles",
      "Superstition - Stevie Wonder"
    ]
  },
  {
    challenge: "A track perfect for stargazing",
    songs: [
      "Space Oddity - David Bowie",
      "Fly Me to the Moon - Frank Sinatra",
      "Clair de Lune - Claude Debussy",
      "Wish You Were Here - Pink Floyd",
      "Under the Milky Way - The Church",
      "Across the Universe - The Beatles",
      "Starman - David Bowie",
      "Champagne Supernova - Oasis",
      "Vincent (Starry Starry Night) - Don McLean",
      "Moon River - Andy Williams",
      "The Great Gig in the Sky - Pink Floyd",
      "Space Song - Beach House",
      "Stardust - Nat King Cole",
      "When You Wish Upon a Star - Cliff Edwards",
      "Tonight, Tonight - The Smashing Pumpkins"
    ]
  },
  {
    challenge: "Song that makes you feel nostalgic",
    songs: [
      "Glory Days - Bruce Springsteen",
      "Summer of '69 - Bryan Adams",
      "Photograph - Nickelback",
      "Good Riddance (Time of Your Life) - Green Day",
      "Yesterday - The Beatles",
      "Those Were the Days - Mary Hopkin",
      "1979 - Smashing Pumpkins",
      "1985 - Bowling for Soup",
      "Jack & Diane - John Mellencamp",
      "We Are Young - fun. ft. Janelle Monáe",
      "See You Again - Wiz Khalifa ft. Charlie Puth",
      "Castle on the Hill - Ed Sheeran",
      "Old Time Rock & Roll - Bob Seger",
      "Memories - Maroon 5",
      "In My Life - The Beatles"
    ]
  },
  {
    challenge: "Best song by a one-hit wonder",
    songs: [
      "Take On Me - a-ha",
      "Come On Eileen - Dexys Midnight Runners",
      "Tainted Love - Soft Cell",
      "Macarena - Los Del Río",
      "Mambo No. 5 (A Little Bit Of...) - Lou Bega",
      "I'm Too Sexy - Right Said Fred",
      "Ice Ice Baby - Vanilla Ice",
      "Tubthumping - Chumbawamba",
      "Somebody That I Used to Know - Gotye ft. Kimbra",
      "Mickey - Toni Basil",
      "Video Killed the Radio Star - The Buggles",
      "99 Luftballons - Nena",
      "Kung Fu Fighting - Carl Douglas",
      "Bitter Sweet Symphony - The Verve",
      "Stacy's Mom - Fountains of Wayne"
    ]
  },
  {
    challenge: "A song featuring a choir",
    songs: [
      "You Can't Always Get What You Want - The Rolling Stones",
      "Like a Prayer - Madonna",
      "Another Brick in the Wall (Part II) - Pink Floyd",
      "I Want to Know What Love Is - Foreigner",
      "Man in the Mirror - Michael Jackson",
      "We Don't Need Another Hero (Thunderdome) - Tina Turner",
      "All These Things That I've Done - The Killers",
      "Oh Happy Day - Edwin Hawkins Singers",
      "I Still Haven't Found What I'm Looking For (Live) - U2 with Gospel Choir",
      "We Are the World - USA for Africa",
      "From a Distance - Bette Midler",
      "Happy Xmas (War Is Over) - John Lennon & Yoko Ono (w/ Harlem Choir)",
      "Higher Love - Steve Winwood",
      "Shower the People - James Taylor (live with choir)",
      "Bridge Over Troubled Water (Live) - Aretha Franklin"
    ]
  },
  {
    challenge: "Track that sounds futuristic",
    songs: [
      "I Feel Love - Donna Summer",
      "Blue Monday - New Order",
      "Harder, Better, Faster, Stronger - Daft Punk",
      "Are 'Friends' Electric? - Tubeway Army",
      "Sandstorm - Darude",
      "The Robots - Kraftwerk",
      "Baba O'Riley - The Who",
      "Autobahn - Kraftwerk",
      "Stronger - Kanye West",
      "Virtual Insanity - Jamiroquai",
      "Firestarter - The Prodigy",
      "Around the World - Daft Punk",
      "O Superman - Laurie Anderson",
      "Trans-Europe Express - Kraftwerk",
      "Blinding Lights - The Weeknd"
    ]
  },
  {
    challenge: "Song that always makes you laugh",
    songs: [
      "Eat It - \"Weird Al\" Yankovic",
      "Never Gonna Give You Up - Rick Astley",
      "Gangnam Style - PSY",
      "Barbie Girl - Aqua",
      "Baby Got Back - Sir Mix-a-Lot",
      "What Does the Fox Say - Ylvis",
      "I'm on a Boat - The Lonely Island ft. T-Pain",
      "Always Look on the Bright Side of Life - Monty Python",
      "Stacy's Mom - Fountains of Wayne",
      "Because I Got High - Afroman",
      "Tribute - Tenacious D",
      "The Chicken Dance - Bob Kames",
      "Yakety Sax - Boots Randolph",
      "Smells Like Nirvana - \"Weird Al\" Yankovic",
      "Thrift Shop - Macklemore & Ryan Lewis"
    ]
  },
  {
    challenge: "Best song to listen to with headphones",
    songs: [
      "Bohemian Rhapsody - Queen",
      "Time - Pink Floyd",
      "A Day in the Life - The Beatles",
      "Paranoid Android - Radiohead",
      "Wish You Were Here - Pink Floyd",
      "When Doves Cry - Prince",
      "Baba O'Riley - The Who",
      "Roundabout - Yes",
      "Welcome to the Machine - Pink Floyd",
      "Hide and Seek - Imogen Heap",
      "Clair de Lune - Claude Debussy",
      "Tom Sawyer - Rush",
      "I Am the Walrus - The Beatles",
      "No Surprises - Radiohead",
      "Voodoo Child (Slight Return) - Jimi Hendrix"
    ]
  },
  {
    challenge: "A song about animals",
    songs: [
      "Hound Dog - Elvis Presley",
      "Eye of the Tiger - Survivor",
      "Blackbird - The Beatles",
      "White Rabbit - Jefferson Airplane",
      "Crocodile Rock - Elton John",
      "Rock Lobster - The B-52's",
      "Barracuda - Heart",
      "Wild Horses - The Rolling Stones",
      "Who Let the Dogs Out - Baha Men",
      "Hungry Like the Wolf - Duran Duran",
      "The Lion Sleeps Tonight - The Tokens",
      "Werewolves of London - Warren Zevon",
      "Bat Out of Hell - Meat Loaf",
      "A Horse with No Name - America",
      "Octopus's Garden - The Beatles"
    ]
  },
  {
    challenge: "The most dramatic song you know",
    songs: [
      "Bohemian Rhapsody - Queen",
      "Stairway to Heaven - Led Zeppelin",
      "November Rain - Guns N' Roses",
      "O Fortuna (Carmina Burana) - Carl Orff",
      "Total Eclipse of the Heart - Bonnie Tyler",
      "The Show Must Go On - Queen",
      "One - Metallica",
      "Earth Song - Michael Jackson",
      "Con te partirò (Time to Say Goodbye) - Andrea Bocelli & Sarah Brightman",
      "A Day in the Life - The Beatles",
      "Hallelujah - Jeff Buckley",
      "Nights in White Satin - The Moody Blues",
      "My Heart Will Go On - Celine Dion",
      "Symphony No. 7, II. Allegretto - Beethoven (dramatic classical)",
      "I Will Always Love You - Whitney Houston"
    ]
  },
  {
    challenge: "Song with a question in the title",
    songs: [
      "What's Going On - Marvin Gaye",
      "How Deep Is Your Love - Bee Gees",
      "Should I Stay or Should I Go - The Clash",
      "Where Is the Love? - The Black Eyed Peas",
      "Do You Really Want to Hurt Me - Culture Club",
      "Who Are You - The Who",
      "What Is Love - Haddaway",
      "Are You Gonna Go My Way - Lenny Kravitz",
      "Is This Love - Bob Marley & The Wailers",
      "Do Ya Think I'm Sexy? - Rod Stewart",
      "What's Up? - 4 Non Blondes",
      "Are You Lonesome Tonight? - Elvis Presley",
      "How Will I Know - Whitney Houston",
      "Will You Love Me Tomorrow - The Shirelles",
      "What Do You Mean? - Justin Bieber"
    ]
  },
  {
    challenge: "A track that feels like floating",
    songs: [
      "Clair de Lune - Claude Debussy",
      "Albatross - Fleetwood Mac",
      "Orinoco Flow (Sail Away) - Enya",
      "Porcelain - Moby",
      "Teardrop - Massive Attack",
      "Fade Into You - Mazzy Star",
      "Weightless - Marconi Union",
      "Somewhere Over the Rainbow/What a Wonderful World - Israel Kamakawiwo'ole",
      "Dreams - Fleetwood Mac",
      "Across the Universe - The Beatles",
      "Sailing - Christopher Cross",
      "Only Time - Enya",
      "Moon River - Andy Williams",
      "Sleep Walk - Santo & Johnny",
      "Return to Innocence - Enigma"
    ]
  },
  {
    challenge: "Song that mentions food or drink",
    songs: [
      "Sugar, Sugar - The Archies",
      "Red Red Wine - UB40",
      "Pour Some Sugar on Me - Def Leppard",
      "Watermelon Sugar - Harry Styles",
      "Cake by the Ocean - DNCE",
      "Cherry Pie - Warrant",
      "American Pie - Don McLean",
      "Strawberry Fields Forever - The Beatles",
      "Blueberry Hill - Fats Domino",
      "Coconut - Harry Nilsson",
      "Milkshake - Kelis",
      "Gin and Juice - Snoop Dogg",
      "Tequila - The Champs",
      "Lollipop - The Chordettes",
      "Day-O (The Banana Boat Song) - Harry Belafonte"
    ]
  },
  {
    challenge: "Best song from the year you were born",
    songs: [
      "Rock Around the Clock - Bill Haley & His Comets (1955)",
      "Johnny B. Goode - Chuck Berry (1958)",
      "(I Can't Get No) Satisfaction - The Rolling Stones (1965)",
      "Hey Jude - The Beatles (1968)",
      "Superstition - Stevie Wonder (1972)",
      "Hotel California - Eagles (1977)",
      "Billie Jean - Michael Jackson (1983)",
      "Sweet Child o' Mine - Guns N' Roses (1988)",
      "Smells Like Teen Spirit - Nirvana (1991)",
      "...Baby One More Time - Britney Spears (1998)",
      "Lose Yourself - Eminem (2002)",
      "Crazy in Love - Beyoncé ft. Jay-Z (2003)",
      "Rolling in the Deep - Adele (2011)",
      "Despacito - Luis Fonsi ft. Daddy Yankee (2017)",
      "Blinding Lights - The Weeknd (2019)"
    ]
  },
  {
    challenge: "A song featuring whistling",
    songs: [
      "(Sittin' On) The Dock of the Bay - Otis Redding",
      "Patience - Guns N' Roses",
      "Moves Like Jagger - Maroon 5 ft. Christina Aguilera",
      "Young Folks - Peter Bjorn and John",
      "Wind of Change - Scorpions",
      "Don't Worry, Be Happy - Bobby McFerrin",
      "Home - Edward Sharpe & The Magnetic Zeros",
      "Me and Julio Down by the Schoolyard - Paul Simon",
      "Games Without Frontiers - Peter Gabriel",
      "Walk Like an Egyptian - The Bangles",
      "Jealous Guy - John Lennon",
      "Good Life - OneRepublic",
      "Whistle - Flo Rida",
      "Daydream - The Lovin' Spoonful",
      "Sucker - Jonas Brothers"
    ]
  },
  {
    challenge: "Track that sounds like it's from another planet",
    songs: [
      "Space Oddity - David Bowie",
      "Also Sprach Zarathustra (Theme from 2001: A Space Odyssey) - Richard Strauss",
      "Telstar - The Tornados",
      "Tomorrow Never Knows - The Beatles",
      "Interstellar Overdrive - Pink Floyd",
      "2000 Light Years from Home - The Rolling Stones",
      "Planet Caravan - Black Sabbath",
      "Calling Occupants of Interplanetary Craft - Carpenters",
      "Spaceman - Babylon Zoo",
      "Major Tom (Coming Home) - Peter Schilling",
      "Oxygène (Part IV) - Jean-Michel Jarre",
      "Cantina Band - John Williams (from Star Wars)",
      "Spaceman - The Killers",
      "X-Files Theme - Mark Snow",
      "E.T. - Katy Perry ft. Kanye West"
    ]
  },
  {
    challenge: "Song that makes you feel like a superhero",
    songs: [
      "Eye of the Tiger - Survivor",
      "Holding Out for a Hero - Bonnie Tyler",
      "Heroes - David Bowie",
      "We Are the Champions - Queen",
      "Hall of Fame - The Script ft. will.i.am",
      "Titanium - David Guetta ft. Sia",
      "The Final Countdown - Europe",
      "Immigrant Song - Led Zeppelin",
      "Don't Stop Me Now - Queen",
      "Centuries - Fall Out Boy",
      "Believer - Imagine Dragons",
      "Fight Song - Rachel Platten",
      "Kryptonite - 3 Doors Down",
      "Theme from Superman (Main Title) - John Williams",
      "Roar - Katy Perry"
    ]
  },
  {
    challenge: "Best song for a slow dance",
    songs: [
      "At Last - Etta James",
      "Unchained Melody - The Righteous Brothers",
      "Can't Help Falling in Love - Elvis Presley",
      "Stand by Me - Ben E. King",
      "Let's Stay Together - Al Green",
      "Wonderful Tonight - Eric Clapton",
      "Lady in Red - Chris de Burgh",
      "My Girl - The Temptations",
      "Careless Whisper - George Michael",
      "Endless Love - Diana Ross & Lionel Richie",
      "I Don't Want to Miss a Thing - Aerosmith",
      "Thinking Out Loud - Ed Sheeran",
      "All of Me - John Legend",
      "Truly Madly Deeply - Savage Garden",
      "Your Song - Elton John"
    ]
  },
  {
    challenge: "A song about rebellion or protest",
    songs: [
      "Blowin' in the Wind - Bob Dylan",
      "For What It's Worth - Buffalo Springfield",
      "Fortunate Son - Creedence Clearwater Revival",
      "Ohio - Crosby, Stills, Nash & Young",
      "Get Up, Stand Up - Bob Marley & The Wailers",
      "God Save the Queen - Sex Pistols",
      "Fight the Power - Public Enemy",
      "Killing in the Name - Rage Against the Machine",
      "Sunday Bloody Sunday - U2",
      "The Revolution Will Not Be Televised - Gil Scott-Heron",
      "Zombie - The Cranberries",
      "Born in the U.S.A. - Bruce Springsteen",
      "American Idiot - Green Day",
      "Alright - Kendrick Lamar",
      "This Is America - Childish Gambino"
    ]
  },
  {
    challenge: "The quietest, most peaceful song",
    songs: [
      "The Sound of Silence - Simon & Garfunkel",
      "Imagine - John Lennon",
      "What a Wonderful World - Louis Armstrong",
      "Yesterday - The Beatles",
      "Gymnopédie No.1 - Erik Satie",
      "Nocturne in E-flat major, Op. 9 No. 2 - Frédéric Chopin",
      "River Flows in You - Yiruma",
      "Angel - Sarah McLachlan",
      "Over the Rainbow - Judy Garland",
      "Hallelujah - Jeff Buckley",
      "Harvest Moon - Neil Young",
      "Let It Be - The Beatles",
      "Vincent (Starry Starry Night) - Don McLean",
      "Watermark - Enya",
      "Weightless - Marconi Union"
    ]
  },
  {
    challenge: "Song with a person's name in the title",
    songs: [
      "Sweet Caroline - Neil Diamond",
      "Hey Jude - The Beatles",
      "Jolene - Dolly Parton",
      "Roxanne - The Police",
      "Layla - Derek & the Dominos",
      "Come On Eileen - Dexys Midnight Runners",
      "Angie - The Rolling Stones",
      "Johnny B. Goode - Chuck Berry",
      "Buddy Holly - Weezer",
      "Mrs. Robinson - Simon & Garfunkel",
      "Stacy's Mom - Fountains of Wayne",
      "Hey There Delilah - Plain White T's",
      "Valerie - Mark Ronson ft. Amy Winehouse",
      "Jack & Diane - John Mellencamp",
      "Jessie's Girl - Rick Springfield"
    ]
  },
  {
    challenge: "A track that builds up intensity",
    songs: [
      "Stairway to Heaven - Led Zeppelin",
      "Boléro - Maurice Ravel",
      "A Day in the Life - The Beatles",
      "One - Metallica",
      "Where the Streets Have No Name - U2",
      "Bridge Over Troubled Water - Simon & Garfunkel",
      "I Will Always Love You - Whitney Houston",
      "Free Bird - Lynyrd Skynyrd",
      "Nothing Else Matters - Metallica",
      "Paranoid Android - Radiohead",
      "Foreplay/Long Time - Boston",
      "Champagne Supernova - Oasis",
      "Under Pressure - Queen & David Bowie",
      "Heroin - The Velvet Underground",
      "Gimme Shelter - The Rolling Stones"
    ]
  },
  {
    challenge: "Song that feels like a secret",
    songs: [
      "Secret - The Pierces",
      "Dirty Little Secret - All-American Rejects",
      "Secret - Madonna",
      "Ocean Eyes - Billie Eilish",
      "In the Air Tonight - Phil Collins",
      "Hide and Seek - Imogen Heap",
      "Breathe Me - Sia",
      "Secrets - OneRepublic",
      "Secret Garden - Bruce Springsteen",
      "Careless Whisper - George Michael",
      "Do You Want to Know a Secret - The Beatles",
      "Secret Lovers - Atlantic Starr",
      "The Sweetest Taboo - Sade",
      "Wicked Game - Chris Isaak",
      "Secret Agent Man - Johnny Rivers"
    ]
  },
  {
    challenge: "Best song to clean your house to",
    songs: [
      "Uptown Funk - Mark Ronson ft. Bruno Mars",
      "Can't Stop the Feeling! - Justin Timberlake",
      "Shake It Off - Taylor Swift",
      "I Wanna Dance with Somebody - Whitney Houston",
      "Wake Me Up Before You Go-Go - Wham!",
      "Walking on Sunshine - Katrina & The Waves",
      "Happy - Pharrell Williams",
      "Dancing Queen - ABBA",
      "Girls Just Want to Have Fun - Cyndi Lauper",
      "Hey Ya! - Outkast",
      "Twist and Shout - The Beatles",
      "Pump Up the Jam - Technotronic",
      "Mr. Brightside - The Killers",
      "Livin' La Vida Loca - Ricky Martin",
      "Wannabe - Spice Girls"
    ]
  },
  {
    challenge: "A song featuring hand claps",
    songs: [
      "Take the Money and Run - Steve Miller Band",
      "We Will Rock You - Queen",
      "HandClap - Fitz and The Tantrums",
      "Mickey - Toni Basil",
      "Some Nights - fun.",
      "Ho Hey - The Lumineers",
      "Cecilia - Simon & Garfunkel",
      "I Want to Hold Your Hand - The Beatles",
      "Happy - Pharrell Williams",
      "Footloose - Kenny Loggins",
      "Centerfield - John Fogerty",
      "Waterloo - ABBA",
      "Jack & Diane - John Mellencamp",
      "The Clapping Song - Shirley Ellis",
      "Hey Ya! - Outkast"
    ]
  },
  {
    challenge: "The most epic song intro ever",
    songs: [
      "Baba O'Riley - The Who",
      "Thunderstruck - AC/DC",
      "Sweet Child o' Mine - Guns N' Roses",
      "Smells Like Teen Spirit - Nirvana",
      "Smoke on the Water - Deep Purple",
      "Money for Nothing - Dire Straits",
      "Iron Man - Black Sabbath",
      "You Really Got Me - The Kinks",
      "Jump - Van Halen",
      "Billie Jean - Michael Jackson",
      "Seven Nation Army - The White Stripes",
      "Kashmir - Led Zeppelin",
      "The Final Countdown - Europe",
      "Crazy Train - Ozzy Osbourne",
      "Livin' on a Prayer - Bon Jovi"
    ]
  }
].map(item => ({
  text: item.challenge,
  songs: item.songs.map(parseSongString)
}));

// TypeScript interfaces for type safety
export interface SongIdentifier {
  title: string;
  artist: string;
}

export interface ChallengeWithSongs {
  text: string;
  songs: SongIdentifier[];
}