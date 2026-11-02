package controller

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

type contactItem struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	URL         string `json:"url"`
	Icon        string `json:"icon,omitempty"`
	Enabled     bool   `json:"enabled"`
	Sort        int    `json:"sort,omitempty"`
}

// GetPublicContacts returns the enabled, administrator-configured contact methods.
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
		if item.Enabled && strings.TrimSpace(item.Name) != "" && strings.TrimSpace(item.URL) != "" {
			enabled = append(enabled, item)
		}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": enabled})
}
