package controller

import (
	"encoding/json"
	"net/http"
	"sort"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

type contactItem struct {
	Name string `json:"name"`
	Description string `json:"description,omitempty"`
	URL string `json:"url"`
	Icon string `json:"icon,omitempty"`
	QRCode string `json:"qr_code,omitempty"`
	Enabled bool `json:"enabled"`
	Sort int `json:"sort,omitempty"`
}

func validContactURL(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	return strings.HasPrefix(value, "https://") || strings.HasPrefix(value, "http://")
}

func GetPublicContacts(c *gin.Context) {
	common.OptionMapRWMutex.RLock()
	raw := common.Interface2String(common.OptionMap["ContactMethods"])
	common.OptionMapRWMutex.RUnlock()

	var items []contactItem
	if strings.TrimSpace(raw) != "" {
		if err := json.Unmarshal([]byte(raw), &items); err != nil {
			c.JSON(http.StatusOK, gin.H{"success": true, "data": []contactItem{}})
			return
		}
	}

	enabled := make([]contactItem, 0, len(items))
	for _, item := range items {
		item.Name = strings.TrimSpace(item.Name)
		item.URL = strings.TrimSpace(item.URL)
		if !item.Enabled || item.Name == "" || !validContactURL(item.URL) {
			continue
		}
		if !validContactURL(item.QRCode) {
			item.QRCode = ""
		}
		enabled = append(enabled, item)
	}
	sort.SliceStable(enabled, func(i, j int) bool {
		return enabled[i].Sort < enabled[j].Sort
	})
	c.JSON(http.StatusOK, gin.H{"success": true, "data": enabled})
}
