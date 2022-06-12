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
# setwd("C:/R/BRPL/")

#remoce all object
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

fileName <- param[1]
samplingDateQuery <- param[2]
wppQuery <- param[3]
resourceQuery <- param[4]
locationQuery <- param[5]
speciesQuery <- param[6]
lengthQuery <- param[7]
weightQuery <- param[8]

# Building query selector
sqQuery <- paste("SELECT panjang, berat FROM brpl_biologireproduksidetail INNER JOIN brpl_biologireproduksi on brpl_biologireproduksi.uuid = brpl_biologireproduksidetail.uuid_biologireproduksi WHERE ",
 samplingDateQuery, wppQuery, resourceQuery, locationQuery, speciesQuery, lengthQuery, weightQuery)

# Execute query to database
q_panjangberat <- dbSendQuery(con, sqQuery)

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

jpeg(paste0("r-scripts/images/", fileName,'.jpg'))
fig_panjangberat
dev.off()

dbClearResult(q_panjangberat)
