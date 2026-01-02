package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type Item struct {
	Label string `json:"label"`
	Href  string `json:"href"`
	Type  string `json:"type"`
}

func normalizeText(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "None"
	}

	s = strings.NewReplacer(
		"\u00a0", " ",
		"\n", " ",
		"\r", " ",
		"\t", " ",
	).Replace(s)

	s = strings.Join(strings.Fields(s), " ")
	if s == "" {
		return "None"
	}

	return s
}

func scrapeHandler(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("url")
	if target == "" {
		http.Error(w, "missing url param", http.StatusBadRequest)
		return
	}

	baseURL, err := url.Parse(target)
	if err != nil {
		http.Error(w, "invalid url", http.StatusBadRequest)
		return
	}

	fmt.Print("Getting", target, "...")

	req, err := http.NewRequest("GET", target, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; SimpleScraper/1.0)")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	fmt.Println(" (", resp.Status, ")")

	fmt.Println("Parsing HTML...")

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	items := make([]Item, 0)

	doc.Find("a[href]").Each(func(_ int, s *goquery.Selection) {
		href, _ := s.Attr("href")
		abs := baseURL.ResolveReference(&url.URL{Path: href}).String()

		items = append(items, Item{
			Label: normalizeText(s.Text()),
			Href:  abs,
			Type:  "a",
		})
	})

	doc.Find("img[src]").Each(func(_ int, s *goquery.Selection) {
		src, _ := s.Attr("src")
		abs := baseURL.ResolveReference(&url.URL{Path: src}).String()

		alt, _ := s.Attr("alt")

		items = append(items, Item{
			Label: normalizeText(alt),
			Href:  abs,
			Type:  "img",
		})
	})

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	fmt.Println("Scraping successful")
	json.NewEncoder(w).Encode(items)
}

func main() {
	http.HandleFunc("/scrape", scrapeHandler)

	log.Println("Scraper server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
