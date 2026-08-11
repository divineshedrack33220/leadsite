const bcrypt = require("bcryptjs");
const store = require("./store");

const INDEX_CONTENT = `
    <img src="images/hero.jpg" alt="Small gbola natural solution" class="hero-image">

    <div class="banner">
      <h1 class="headline">
        A Natural Way To Get Rid Of Small Gbola, 1 Minute Knacking Problems Without Side Effect
      </h1>

      <p class="body-text">
        You See, I Want Us To Discuss Man To Man
      </p>

      <p class="body-text">
        Here Is Not Appropriate, So Let's Go To The Other Side
      </p>

      <p class="body-text">
        Enter your text here&hellip;
      </p>
    </div>

    <img src="images/hero.gif" alt="Animated image" class="gif-image">

    <a href="sales.html" class="access-btn" id="access-btn">
      Get Instant Access
    </a>

    <a href="sales.html" class="bottom-link">
      <img src="images/bottom.jpg" alt="Bottom image" class="bottom-image">
    </a>

    <img src="images/extra.jpg" alt="Extra image" class="extra-image">
`;

const SALES_CONTENT = `
    <header class="top-banner">
      <p class="top-banner-text">HURRY!!! THIS OFFER ENDS IN</p>
      <div class="countdown" id="countdown">
        <div class="cd-box"><span class="cd-num" id="cd-days">00</span><span class="cd-label">DAYS</span></div>
        <div class="cd-box"><span class="cd-num" id="cd-hours">00</span><span class="cd-label">HOURS</span></div>
        <div class="cd-box"><span class="cd-num" id="cd-mins">00</span><span class="cd-label">MINUTES</span></div>
        <div class="cd-box"><span class="cd-num" id="cd-secs">00</span><span class="cd-label">SECONDS</span></div>
      </div>
    </header>

    <img src="images/product.jpg" alt="Happy Family Manpower Syrup" class="product-img">

    <div class="offer-wrap">
      <a href="#" class="offer-btn" id="offer-btn">
        GET 50% OFF NOW
      </a>
    </div>

    <div class="black-box">
      <p class="black-box-text">
        Are you sick and tired of having your woman make fun of your <span class="highlight">little penis, poor erection, and quick ejaculation</span> every time you try to make love?
      </p>
    </div>

    <p class="plain-text">
      To be honest with you there's nothing as <span class="red-highlight">embarrassing, annoying and humiliating</span> as wanting to go down with your woman and your penis starts misbehaving
    </p>

    <img src="images/offer.gif" alt="Offer" class="offer-gif">

    <p class="plain-text under-gif">
      (is either, it's too small and she's not feeling it or you ejaculate immediately you penetrate her wet-juicy-pussy)
    </p>

    <img src="images/emotion.gif" alt="Frustrating situation" class="emotion-gif">

    <p class="plain-text">
      It's One of the most frustrating &amp; embarrassing situations a man can experience in life
    </p>

    <img src="images/size.jpg" alt="Size matters" class="size-img">

    <p class="plain-text">
      We all know that size and how long you last <span class="red-highlight">matters alot</span> when it comes to bedroom activities
    </p>

    <p class="plain-text">
      And no woman is happy when she's dealing with a man with small penis and that can't even last long enough to satisfy her, when what she truly deserves is a big cock,
    </p>

    <img src="images/man.jpg" alt="A real man" class="man-img">

    <p class="plain-text">
      A man that can fuck hell out of her juicy pussy
    </p>

    <img src="images/desire.gif" alt="Women desires" class="desire-gif">

    <p class="plain-text">
      One thing you should understand as a man is that women dont joke with their <span class="red-highlight">sexual desires</span>
    </p>

    <p class="plain-text">
      No matter how much a woman loves you, no matter how religious she is, if you don't satisfy her in bed she will find a more capable man who will Satisfy her, That's one of the major reason why most of these women (especially the ones married to rich &amp; wealthy men) cheat on their partners with broke and struggling men that has nothing to offer them
    </p>

    <p class="see-for-yourself">
      See for yourself below
    </p>

    <div class="proof-row">
      <img src="images/proof1.jpg" alt="Proof 1" class="proof-img">
      <img src="images/proof2.jpg" alt="Proof 2" class="proof-img">
    </div>

    <div class="proof-row">
      <img src="images/proof3.jpg" alt="Proof 3" class="proof-img">
      <img src="images/proof4.jpg" alt="Proof 4" class="proof-img">
    </div>

    <p class="plain-text spaced-top">
      Asides from that Generally as a man, not lasting long in bed and having a <span class="red-highlight">small manhood</span> will always affect your self esteem making you feel less of yourself
    </p>

    <div class="tri-grid">
      <img src="images/row1.jpg" alt="Row 1" class="tri-top">
      <img src="images/row2.jpg" alt="Row 2" class="tri-top">
      <img src="images/row3.jpg" alt="Row 3" class="tri-bottom">
    </div>

    <p class="plain-text">
      But my brother I want you to understand that it's not your fault that you are having this problem
    </p>

    <p class="plain-text">
      I mean for the fact that you're always looking for solutions and <span class="red-highlight">ways to solve this problem means that you're just one step away from the correct product</span> that will help you to get rid of these problems permanently
    </p>

    <p class="plain-text">
      And that's where this New effective and powerful herbal solution comes in&hellip;
    </p>

    <div class="red-box">
      <p class="red-box-heading">LISTEN</p>
      <p class="red-box-text">
        If you're having a small manhood and you are tired of the shames &amp; embarrassments
      </p>
      <p class="red-box-text">
        If you're having trouble getting an erection when you need to get to work,
      </p>
      <p class="red-box-text">
        &hellip;or your penis turns soft right away&hellip; and you can't go for more than one round&hellip;
      </p>
      <p class="red-box-text">
        And you're sick &amp; tired of making watery &amp; pathetic excuses to your woman every time you let her down in bed,
      </p>
    </div>

    <p class="need-text">
      What you need now and ever is this👇
    </p>

    <img src="images/product.jpg" alt="Happy Family Manpower Syrup" class="product-img">

    <p class="nafdac-purple">NAFDAC NO: A72061L</p>

    <div class="offer-wrap">
      <a href="#" class="order-btn-blue" id="order-now-btn">
        ORDER NOW
      </a>
    </div>

    <p class="strong-man-text">
      IF YOU HAVE EVER WISHED FOR A <span class="red-highlight">PRODUCT</span> THAT WORKS INSTANTLY AFTER USE THEN THIS <span class="red-highlight">STRONG MAN SYRUP</span> FOR MEN IS WHAT YOU NEED
    </p>

    <p class="blue-text">
      SAFE, VERY EFFECTIVE and NATURAL Solution that will help you <span class="red-highlight">last longer between 45mins &ndash; 1hour in Bed and grow your penis to your desired size.</span> This Ogbonge MAN POWER has saved over 11,750+ African MEN from painful bedroom embarrassment&hellip;
    </p>

    <img src="images/natural.jpg" alt="Natural solution" class="natural-img">

    <img src="images/under.jpg" alt="More info" class="under-img">

    <img src="images/buy.gif" alt="Buy" class="buy-gif">

    <div class="offer-wrap">
      <a href="#" class="buy-btn" id="buy-now-btn">
        BUY NOW
      </a>
    </div>

    <img src="images/solution.webp" alt="Solution" class="solution-img">

    <p class="plain-text">
      <span class="red-highlight">A permanent and effective solution to weak erection, quick ejaculation and small penis</span>
    </p>

    <img src="images/product.jpg" alt="Happy Family Manpower Syrup" class="product-img">

    <div class="offer-wrap">
      <a href="#" class="buy-btn" id="buy-now-btn-2">
        BUY NOW
      </a>
    </div>

    <img src="images/follow.jpg" alt="More" class="follow-img">

    <img src="images/next.jpg" alt="Next" class="next-img">

    <img src="images/more.jpg" alt="More" class="more-img">

    <h2 class="diff-heading">
      So how is this <span class="red-highlight">HAPPY FAMILY MANPOWER SYRUP</span> different from other products you have seen and taken before
    </h2>

    <ul class="diff-list">
      <li>It is 100% Natural with no side effects</li>
      <li><span class="red-highlight">It helps you gain strong and lasting erection instantly 45mins after taking it</span></li>
      <li>It will help you boost your sex drive and libido by 100% so that you can last longer with strong erected penis anytime you want to make love to your woman</li>
      <li><span class="red-highlight">It Permanently Increases your PENIS size IN TWO WEEKS, Cures PREMATURED EJACULATIONS and WEAK ERECTION in 7DAYS</span></li>
      <li>Helps remove male impotence and erectile dysfunction</li>
      <li><span class="red-highlight">Increases the thickness, length and size of the penis</span></li>
      <li>Increases sexual stimulation, arousal and prolong sex time</li>
      <li><span class="red-highlight">Helps Increase Energy, stamina, vitality and endurance</span></li>
      <li>Promotes proper blood circulation to your penis</li>
      <li><span class="red-highlight">Helps in prostate health</span></li>
      <li>Cures low sperm count</li>
    </ul>

    <img src="images/result.gif" alt="Result" class="result-gif">

    <p class="plain-text">
      Unlike the other products you have taken before this <span class="red-highlight">HAPPY FAMILY MANPOWER SYRUP</span> will first of all fight and treat the root cause of your poor erection and <span class="red-highlight">small manhood problems</span>, after which it will instantly boost up your sex drive &amp; libido and permanently grow your penis to your <span class="red-highlight">desired size.</span>
    </p>

    <p class="plain-text">
      With this you will never have to worry about <span class="red-highlight">small penis, weak erection and quick ejaculation problems again</span> and the amazing part of this product is that you will start seeing visible results once you start taking it and the healing effects are permanent with absolutely <span class="red-highlight">zero side effects</span>
    </p>

    <img src="images/fuck.gif" alt="Result" class="fuck-gif">

    <img src="images/after.webp" alt="After" class="after-img">

    <div class="testimonial-block">
      <p class="testi">&gt;&gt; One of the main reasons why I bought this product was because of the instant result promised by the doctor</p>
      <p class="testi">&gt;&gt; I was tired of all these 30-Days product, because I've wasted so much money and even after the 30 days, I still don't see any result.</p>
      <p class="testi">&gt;&gt; So, I needed something that is safe and can do the job immediately.</p>
      <p class="testi">&gt;&gt; And amazingly, the product worked beyond my expectations.</p>
      <p class="testi">&gt;&gt; The first night I used this product, I was surprised that I could last more than 30minutes and i notice an increase in size of penis, it was bigger and a bit longer than it used to be even my wife couldn't believe it too.</p>
      <p class="testi">&gt;&gt; During the next round, I couldn't even release again.</p>
      <p class="testi">&gt;&gt; at first I was wondering why her pussy was very tight because i was feeling every single wall of her pussy then I remembered the Strong man syrup I took earlier</p>
      <p class="testi">&gt;&gt; I was on top my woman for almost 50 minutes (Me that couldn't even last 1 minute before)</p>
      <p class="testi-mid">But Let Me Tell You What Surprise Me Even More</p>
      <p class="testi">&gt;&gt; She was ENJ0YlNG it.</p>
      <p class="testi">&gt;&gt; All her hidden sexual demon came out that night.</p>
      <p class="testi">&gt;&gt; I was surprised to hear her say "Take Me From The Back" "Let Me Come On Top", "Do this style and do that style"</p>
    </div>

    <img src="images/dance.gif" alt="Happy" class="dance-gif">

    <img src="images/dance2.gif" alt="Happy" class="dance2-gif">

    <div class="testimonial-block">
      <p class="testi"><span class="red-highlight">My brother I never knew this woman like sex like this before</span></p>
      <p class="testi">&gt;&gt; I was like ah ah, Anyways we both enjoyed ourselves and had a great time that night</p>
      <p class="testi">&gt;&gt; And ever since then everything has changed in our intimacy life.</p>
      <p class="testi">&gt;&gt; I am proud of myself now, my woman is always very happy now</p>
    </div>

    <img src="images/happy.webp" alt="Happy" class="happy-img">

    <img src="images/kitchen.jpg" alt="Kitchen" class="kitchen-img">

    <img src="images/product.jpg" alt="Happy Family Manpower Syrup" class="product-img">

    <div class="green-box">
      <p class="green-pod">PAYMENT ON DELIVERY + FREE DELIVERY</p>
      <p class="green-normal">NORMAL PRICE: 31,000</p>
      <p class="green-promo">PROMO PRICE: 15,500</p>
      <p class="green-hurry">HURRY!!! THIS OFFER ENDS IN</p>
    </div>

    <div class="offer-wrap">
      <a href="#" class="yellow-btn" id="missed-btn">
        You missed out!
      </a>
    </div>

    <div class="offer-wrap">
      <a href="#" class="buy-btn" id="buy-now-btn-3">
        BUY NOW
      </a>
    </div>

    <div class="blue-box">
      <p class="blue-box-heading">LET ME TELL YOU WHY THIS PRODUCT IS A MUST-HAVE FOR YOU</p>
      <p class="blue-box-title red-title">Made From Natural Herb:</p>
      <p class="blue-box-text">Unlike all these chemical made products out there, <span class="red-highlight">HAPPY FAMILY MANPOWER SYRUP</span> is made from pure herbs that are safe and healthy.</p>
      <p class="blue-box-title red-title">Safe, Without Side Effect:</p>
      <p class="blue-box-text">This product is extremely safe for everyone because it contains no artificial substances or chemicals.</p>
      <p class="blue-box-title red-title">INSTANT AND PERMANENT RESULT:</p>
      <p class="blue-box-text">Unlike all these supplement out there that makes you wait for 30 days before seeing result, this Erection &amp; Enlargement herbal solution treatment gives instant and permanent result. If you get it tonight, your woman will know that something has jammed her.</p>
    </div>

    <p class="review-heading">
      TAKE A LOOK AT WHAT OTHERS ARE SAYING ABOUT THIS SAME POWERFUL SOLUTION BELOW.
    </p>

    <div class="proof-row">
      <img src="images/rev1.jpg" alt="Review 1" class="proof-img">
      <img src="images/rev2.jpg" alt="Review 2" class="proof-img">
    </div>

    <div class="proof-row">
      <img src="images/rev3.jpg" alt="Review 3" class="proof-img">
      <img src="images/rev4.jpg" alt="Review 4" class="proof-img">
    </div>

    <img src="images/product.jpg" alt="Happy Family Manpower Syrup" class="product-img">

    <div class="offer-wrap">
      <a href="#" class="want-btn" id="want-btn">
        I WANT THE PRODUCT NOW
      </a>
    </div>

    <img src="images/want.jpg" alt="Want" class="want-img">

    <img src="images/dominant.gif" alt="Dominant" class="dominant-gif">

    <img src="images/order.jpg" alt="Order" class="order-img">

    <img src="images/order2.jpg" alt="Order 2" class="order2-img">

    <img src="images/order3.jpg" alt="Order 3" class="order3-img">

    <p class="plain-text">
      <span class="red-highlight">Take control today, don't let another man corner your woman</span>
    </p>

    <div class="proof-row">
      <img src="images/side1.gif" alt="Side 1" class="proof-img">
      <img src="images/side2.gif" alt="Side 2" class="proof-img">
    </div>

    <img src="images/product.jpg" alt="Happy Family Manpower Syrup" class="product-img">

    <div class="green-box">
      <p class="green-pod">PAYMENT ON DELIVERY + FREE DELIVERY</p>
      <p class="green-normal">NORMAL PRICE: 31,000</p>
      <p class="green-promo">PROMO PRICE: 15,500</p>
      <p class="green-hurry">HURRY!!! THIS OFFER ENDS IN</p>
    </div>

    <div class="offer-wrap">
      <a href="#" class="yellow-btn" id="missed-btn-2">
        You missed out!
      </a>
    </div>

    <div class="offer-wrap">
      <a href="#" class="buy-btn" id="buy-now-btn-4">
        BUY NOW
      </a>
    </div>

    <div class="purple-box">
      <p class="purple-heading">HOW TO USE THIS PRODUCT</p>
      <p class="purple-text">Take it 1 to 2 hours before the match.</p>
      <p class="purple-text">You will be surprised at how magical this stuff works. In fact, your WOMAN will be shocked and ask you what or how you did it.</p>
      <p class="purple-sub">Right now, you have two options</p>
      <p class="purple-text"><strong>Option One:</strong> You order the Happy family syrup and make your next intimacy a blast, make your woman proud of you, and feel like a king.</p>
      <p class="purple-text"><strong>Option Two:</strong> Ignore this product and continue pouring within 2 minutes, frustrating your woman and making her unhappy, giving room for her to cheat with your friend or neighbor.</p>
      <p class="purple-ball">The Ball Is In Your Court!!!</p>
    </div>

    <div class="offer-wrap">
      <a href="#" class="buy-btn" id="buy-now-btn-5">
        BUY NOW
      </a>
    </div>

    <hr class="purple-divider">

    <p class="guarantee-text">14 DAYS 100% MONEY-BACK GUARANTEE</p>

    <img src="images/guarantee.png" alt="Money back guarantee" class="guarantee-img">

    <p class="black-note">
      Not Only does the product WORK, It works so well and that is Why we are Offering 100% Money-Back Guarantee to Anyone who uses it for 14 days without Satisfaction and appreciable Result.
    </p>

    <p class="black-note">
      How can we make such a Strong guarantee? THE ANSWER IS SIMPLE, we have used this same product to help more than 1000 Persons achieve Happier and Healthier Lifestyles&hellip; So What Do you have to Loose?
    </p>

    <img src="images/warning.gif" alt="Warning" class="warning-gif">

    <p class="black-note">
      We Spend a lot of Money to Deliver this Product via FedEx to you for FREE.
    </p>

    <p class="black-note">
      So Please and Please DO NOT Order IF:
    </p>

    <ol class="warning-list">
      <li>You are Travelling Outside your provided address within the Next 2-5 Days</li>
      <li>You are NOT Sure OR The Money is not yet Ready and Available</li>
      <li>Your Phone number(s) is Hardly Reachable</li>
    </ol>

    <p class="form-heading">PLEASE FILL THE FORM BELOW TO PLACE ORDER</p>

    <img src="images/hero.gif" alt="Order" class="hero-gif">

    <form class="order-form" id="order-form-main">
      <label for="of-name">NAME <span class="req">*</span></label>
      <input type="text" id="of-name" name="name" placeholder="Please input your complete name" required>

      <label for="of-phone">PHONE NUMBER <span class="req">*</span></label>
      <input type="tel" id="of-phone" name="phone" placeholder="Phone number" required>

      <label for="of-alt">ALTERNATIVE PHONE NUMBER <span class="req">*</span></label>
      <input type="tel" id="of-alt" name="altphone" placeholder="Alternative phone number" required>

      <label for="of-num">NUMBER <span class="req">*</span></label>
      <input type="tel" id="of-num" name="number" placeholder="Phone" required>

      <label for="of-address">COMPLETE DELIVERY ADDRESS <span class="req">*</span></label>
      <textarea id="of-address" name="address" rows="3" placeholder="Please ensure you put your current delivery address" required></textarea>

      <label for="of-quantity">QUANTITY <span class="req">*</span></label>
      <select id="of-quantity" name="quantity" required>
        <option value="">Please pick the quantity you want to purchase</option>
        <option value="1">BUY ONE BOTTLE OF HAPPY FAMILY MANPOWER SYRUP - 15,500 (PROMO PRICE)</option>
        <option value="2">BUY TWO BOTTLES OF HAPPY FAMILY MANPOWER SYRUP - 25,000 (BESTSELLER)</option>
        <option value="3">BUY THREE BOTTLES OF HAPPY FAMILY MANPOWER SYRUP - 35,000 (PREMIUM)</option>
        <option value="4">BUY FOUR BOTTLES OF HAPPY FAMILY MANPOWER SYRUP - 45,000 (FULL PACKAGE)</option>
      </select>

      <button type="submit" class="order-submit">PLACE ORDER</button>
    </form>

    <div class="contact-lines">
      <p class="contact">CALLS ONLY: <a href="tel:+2348133885432">+234 813 388 5432</a></p>
      <p class="contact">CHAT ON WHATSAPP: <a href="https://wa.me/2348132544149">+234 813 254 4149</a></p>
    </div>

    <img src="images/delivery.png" alt="Delivery" class="delivery-img">

    <img src="images/footer.jpg" alt="Footer" class="footer-img">

    <footer class="site-footer">
      <p class="disclaimer">
        DISCLAIMER: This site is not part of the Facebook, Facebook Inc. website nor is it endorsed by Facebook. FACEBOOK is a registered trademark of Facebook Inc. Copyright Fulfilledmart 2024. All rights reserved.
      </p>
    </footer>
`;

function seed() {
  const existingIndex = store.getSetting("content:index", null);
  const existingSales = store.getSetting("content:sales", null);

  if (existingIndex === null) store.setSetting("content:index", INDEX_CONTENT);
  if (existingSales === null) store.setSetting("content:sales", SALES_CONTENT);

  const adminUser = store.getSetting("admin:user", null);
  if (!adminUser) {
    const username = process.env.ADMIN_USER || "admin";
    const password = process.env.ADMIN_PASS || "admin123";
    store.setSetting("admin:user", username);
    store.setSetting("admin:hash", bcrypt.hashSync(password, 10));
    console.log("[seed] Admin account created:");
    console.log(`[seed]   username: ${username}`);
    console.log(`[seed]   password: ${password}`);
    console.log("[seed]   CHANGE THIS!  (set ADMIN_USER / ADMIN_PASS env vars, then delete data/db.json)");
  }
}

module.exports = { seed };
