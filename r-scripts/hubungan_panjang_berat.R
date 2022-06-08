library(Hmisc)
library(doBy)
library(foreign)
library(reshape2)
library(gdata)
library(ggplot2)
library(ggpmisc)
library(ggmap)
library(knitr)
library(xtable)
library(RPostgreSQL)
library(R2HTML)
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
library(stringr)


# setwd("r-scripts/images/")
# setwd("C:/R/RED/")
# imagePath <- "r-scripts/images/"

#remoce all object
rm(list=ls())

trimStr <- function( x ) {
  gsub("(^[[:space:]]+|[[:space:]]+$)", "", x)
}

executedArgs <- commandArgs(trailingOnly=TRUE)


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

#update variable" yang di pake
# fileName <- trimStr(executedArgs[1])
# wpp <- as.numeric(trimStr(executedArgs[2]))
# species <- trimStr(executedArgs[3])
# tahun <- as.numeric(trimStr(executedArgs[4]))
# lokasi <- trimStr(executedArgs[5])
wpp <- as.numeric(trimStr(executedArgs[2]))
species <- trimStr(executedArgs[5])
tahun <- as.numeric(trimStr(executedArgs[3]))
lokasi <- trimStr(executedArgs[4])
fileName <- trimStr(executedArgs[1])

#Send query
q_panjangberat <- dbSendQuery(con, paste0("SELECT panjang, berat
  FROM brpl_biologireproduksidetail INNER JOIN brpl_biologireproduksi bb on bb.uuid = brpl_biologireproduksidetail.uuid_biologireproduksi
  WHERE bb.uuid_spesies like '%",species,"%' AND wpp = '",wpp,"' AND extract(YEAR FROM tanggal_sampling) = '",tahun,"' AND nama_lokasi_sampling = '",lokasi,"';"))

#narik hasil query plus ganti nama kolom
panjangberat <- dbFetch(q_panjangberat, n=-1)
colnames(panjangberat) <- c("Panjang","Berat (gram)")

#bikin graph
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

#delete hasil query di atas biar next query ga error
dbClearResult(q_panjangberat)

png(paste("r-scripts/images/", fileName, ".jpg", sep=""))
#pdf(paste("panjangberat_", wpp,".pdf")) 
#call figure
fig_panjangberat

#pdf("rplot.pdf") 
#ngesave figure yang last called
#dev.print(pdf, file=paste("C:/R/RED/Plots/panjangberat_.pdf"))
#dev.off()
