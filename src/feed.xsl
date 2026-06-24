<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />

  <!-- RFC-822 date → ISO YYYY-MM-DD (XSLT 1.0 string math) -->
  <xsl:template name="isodate">
    <xsl:param name="d" />
    <xsl:variable name="day" select="substring($d, 6, 2)" />
    <xsl:variable name="mon" select="substring($d, 9, 3)" />
    <xsl:variable name="year" select="substring($d, 13, 4)" />
    <xsl:variable name="mm">
      <xsl:choose>
        <xsl:when test="$mon = 'Jan'">01</xsl:when>
        <xsl:when test="$mon = 'Feb'">02</xsl:when>
        <xsl:when test="$mon = 'Mar'">03</xsl:when>
        <xsl:when test="$mon = 'Apr'">04</xsl:when>
        <xsl:when test="$mon = 'May'">05</xsl:when>
        <xsl:when test="$mon = 'Jun'">06</xsl:when>
        <xsl:when test="$mon = 'Jul'">07</xsl:when>
        <xsl:when test="$mon = 'Aug'">08</xsl:when>
        <xsl:when test="$mon = 'Sep'">09</xsl:when>
        <xsl:when test="$mon = 'Oct'">10</xsl:when>
        <xsl:when test="$mon = 'Nov'">11</xsl:when>
        <xsl:otherwise>12</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:value-of select="concat($year, '-', $mm, '-', $day)" />
  </xsl:template>

  <xsl:template match="/">
    <html lang="zh-cn">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><xsl:value-of select="/rss/channel/title" /> · RSS</title>
        <link rel="icon" type="image/png" href="assets/favicon.png" />
        <style>
          :root {
            --bg: #fafafa;
            --panel: #ffffff;
            --text: #1d1d1f;
            --muted: #8a8a8f;        /* comments */
            --punc: #9aa0a6;         /* punctuation / brackets */
            --key: #6f42c1;          /* keys / tags */
            --string: #1a7f4b;       /* strings */
            --number: #b5660b;       /* dates / numbers */
            --accent: #c79f2e;       /* links */
            --line: rgba(0, 0, 0, 0.07);
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --bg: hsl(219, 30%, 10%);
              --panel: hsl(219, 28%, 13%);
              --text: #e6e6e6;
              --muted: #6b7280;
              --punc: #6b7280;
              --key: #c792ea;
              --string: #9ece6a;
              --number: #e0af68;
              --accent: #d4b95e;
              --line: rgba(255, 255, 255, 0.08);
            }
          }

          * { box-sizing: border-box; margin: 0; padding: 0; }

          html {
            font-family: ui-monospace, "SF Mono", "JetBrains Mono", "Menlo",
              "Cascadia Code", "Consolas", monospace;
            font-size: 14px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          body {
            background: var(--bg);
            color: var(--text);
            line-height: 1.7;
            padding: 48px 16px;
          }

          .wrap { max-width: 720px; margin: 0 auto; }

          /* editor window */
          .window {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 10px;
            overflow: hidden;
          }

          .titlebar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            border-bottom: 1px solid var(--line);
          }

          .dot { width: 12px; height: 12px; border-radius: 50%; }
          .dot.r { background: #ff5f57; }
          .dot.y { background: #febc2e; }
          .dot.g { background: #28c840; }

          .filename {
            margin-left: 8px;
            color: var(--muted);
            font-size: 0.82rem;
          }

          .code { padding: 20px 0; }

          /* a code row with a line-number gutter */
          .row {
            display: grid;
            grid-template-columns: 48px 1fr;
            text-decoration: none;
            color: inherit;
          }

          .ln {
            text-align: right;
            padding-right: 16px;
            color: var(--punc);
            opacity: 0.55;
            user-select: none;
            white-space: nowrap;
          }

          .src { padding-right: 24px; white-space: pre-wrap; word-break: break-word; }

          .comment { color: var(--muted); }
          .key { color: var(--key); }
          .punc { color: var(--punc); }
          .string { color: var(--string); }
          .number { color: var(--number); }

          .post .src { padding-top: 10px; }
          .post .title {
            color: var(--accent);
            text-decoration: none;
          }
          a.row:hover .title { text-decoration: underline; }
          a.row:hover .ln { opacity: 1; }

          .spacer .src { height: 6px; }

          .copybtn {
            font: inherit;
            font-size: 0.72rem;
            margin-left: 10px;
            padding: 1px 9px;
            color: var(--muted);
            background: transparent;
            border: 1px solid var(--line);
            border-radius: 5px;
            cursor: pointer;
            vertical-align: baseline;
            transition: color 0.2s, border-color 0.2s;
          }
          .copybtn:hover { color: var(--accent); border-color: var(--accent); }
          .copybtn.ok { color: var(--string); border-color: var(--string); }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="window">
            <div class="titlebar">
              <span class="dot r"></span>
              <span class="dot y"></span>
              <span class="dot g"></span>
              <span class="filename">feed.xml — <xsl:value-of select="count(/rss/channel/item)" /> items</span>
            </div>

            <div class="code">
              <!-- header comment block -->
              <div class="row">
                <span class="ln">1</span>
                <span class="src"><span class="comment"># <xsl:value-of select="/rss/channel/title" /></span></span>
              </div>
              <div class="row">
                <span class="ln">2</span>
                <span class="src"><span class="comment"># <xsl:value-of select="/rss/channel/description" /></span></span>
              </div>
              <div class="row">
                <span class="ln">3</span>
                <span class="src"><span class="key">subscribe</span><span class="punc"> = </span><span class="string">"<xsl:value-of select="/rss/channel/atom:link/@href" />"</span><button type="button" class="copybtn" data-label="copy" onclick="copyFeed(this)"><xsl:attribute name="data-url"><xsl:value-of select="/rss/channel/atom:link/@href" /></xsl:attribute>copy</button></span>
              </div>
              <div class="row spacer">
                <span class="ln">4</span>
                <span class="src"></span>
              </div>

              <!-- one post = one entry -->
              <xsl:for-each select="/rss/channel/item">
                <a class="row post" target="_blank" rel="noopener">
                  <xsl:attribute name="href">
                    <xsl:value-of select="link" />
                  </xsl:attribute>
                  <span class="ln"><xsl:value-of select="position() + 4" /></span>
                  <span class="src"><span class="punc">[</span><span class="number"><xsl:call-template name="isodate"><xsl:with-param name="d" select="pubDate" /></xsl:call-template></span><span class="punc">] </span><span class="title"><xsl:value-of select="title" /></span><xsl:if test="description"><span class="comment">  // <xsl:value-of select="description" /></span></xsl:if></span>
                </a>
              </xsl:for-each>
            </div>
          </div>
        </div>
        <script>
          function copyFeed(btn) {
            var url = btn.getAttribute('data-url');
            function done() {
              btn.textContent = 'copied';
              btn.classList.add('ok');
              setTimeout(function () {
                btn.textContent = btn.getAttribute('data-label');
                btn.classList.remove('ok');
              }, 1500);
            }
            if (navigator.clipboard &amp;&amp; navigator.clipboard.writeText) {
              navigator.clipboard.writeText(url).then(done, done);
            } else {
              var t = document.createElement('textarea');
              t.value = url;
              document.body.appendChild(t);
              t.select();
              document.execCommand('copy');
              document.body.removeChild(t);
              done();
            }
          }
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
