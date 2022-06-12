library(Hmisc)
library(doBy)
library(gdata)
library(ggplot2)
library(ggpmisc)
library(ggmap)
library(RPostgreSQL)
library(memisc)
library(gmodels)
library(plyr)
library(dplyr)
library(RcppEigen)
library(lme4)
library(bootstrap)
library(fishmethods)
library(TropFishR)
library(stargazer)
library(data.table)
library(fishmethods)
library(kableExtra)
library(scales)
library(viridis)

options(echo = TRUE)

#remove all object
rm(list=ls())

param = commandArgs(trailingOnly=TRUE)

#koneksi ke DB
con <- DBI::dbConnect(
  drv = RPostgres::Postgres(),
  dbname = "e_brpl_2",
  host = "localhost",
  port = "5432",
  user = "postgres",
  password = "talasbogor"
)
on.exit(dbDisconnect(drv))

file_name <- param[1]
sampling_date_query <- param[2]
wpp_query <- param[3]
resource_query <- param[4]
location_query <- param[5]
species_query <- param[6]
length_query <- param[7]
weight_query <- param[8]

# Building query selector
sql_query <- paste("SELECT panjang, berat FROM brpl_biologireproduksidetail INNER JOIN brpl_biologireproduksi on brpl_biologireproduksi.uuid = brpl_biologireproduksidetail.uuid_biologireproduksi WHERE ",
 sampling_date_query, wpp_query, resource_query, location_query, species_query, length_query, weight_query)

# Execute query to database
q_panjangberat <- dbSendQuery(con, sql_query)

panjangberat <- dbFetch(q_panjangberat, n=-1)
colnames(panjangberat) <- c("Panjang","Berat (gram)")

fig_panjangberat <-
  ggplot(panjangberat, aes(x = Panjang, y = `Berat (gram)`)) +
  geom_point() +
  stat_smooth(method = 'lm', size = 1.5, se = F, formula = y ~ x) +
  stat_poly_eq(formula = y~x, 
               aes(label = paste(..eq.label.., ..rr.label.., sep = "~~~")), 
               parse = TRUE) +
  theme_classic()
reg1 <- lm(panjangberat$`Berat (gram)`~ panjangberat$Panjang, data = panjangberat)
r2 <- summary(reg1)$adj.r.squared

jpeg(paste0("r-scripts/images/", file_name,'.jpg'))
fig_panjangberat
dev.off()

dbClearResult(q_panjangberat)
